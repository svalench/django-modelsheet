"""Экспорт и разбор таблиц. Значения режутся правами на поля и строки."""

import csv
import importlib.util
import io

from django.core.exceptions import FieldDoesNotExist
from django.http import FileResponse, StreamingHttpResponse
from django.utils.translation import gettext_lazy as _

from .conf import component, config
from .errors import SheetError
from .metadata import require_fields
from .services import check_model, fields_for, object_filter_mode


def presentation(field, value, label):
    if label is not None:
        return "; ".join(label) if isinstance(label, list) else label
    if value is None:
        return ""
    if isinstance(value, list):
        return "; ".join(str(item) for item in value)
    return value


def csv_cell(value):
    text = "" if value is None else str(value)
    # Excel исполняет ячейку, которая начинается с формулы. Гасим префиксом.
    if text[:1] in ("=", "+", "-", "@", "\t", "\r"):
        return "'" + text
    return text


def iter_visible(request, admin, qs):
    mode = object_filter_mode(request, admin)
    if mode == "queryset":
        qs = component("permission_policy").restrict_queryset(request, admin, qs)
    policy = component("permission_policy")
    start, chunk = 0, config()["chunk_size"]
    while True:
        batch = list(qs[start : start + chunk])
        if not batch:
            break
        for obj in batch:
            if mode == "object" and not policy.can_view_object(request, admin, obj):
                continue
            yield obj
        if len(batch) < chunk:
            break
        start += chunk


def visible_pks(request, admin, qs, limit):
    found = []
    for obj in iter_visible(request, admin, qs):
        found.append(obj.pk)
        if len(found) > limit:
            raise SheetError("export_limit", _("Too many rows to export. Narrow the filter."))
    return found


def export_table(request, admin, params):
    from .query import parse_state, queryset

    check_model(request, admin)
    fields = fields_for(request, admin)
    state = parse_state(params)
    state["pagination"] = "offset"
    state["cursor"] = None
    state["offset"] = 0
    columns = state["columns"] or list(fields)
    require_fields(columns, fields)
    state["columns"] = columns
    fmt = params.get("format", "csv")
    if fmt not in ("csv", "xlsx"):
        raise SheetError("invalid_format", _("Use csv or xlsx."))
    if fmt == "xlsx" and importlib.util.find_spec("openpyxl") is None:
        raise SheetError(
            "xlsx_unavailable",
            _("Install django-modelsheet[xlsx] to export Excel files."),
            status=415,
        )
    qs = queryset(request, admin, fields, state)
    pks = visible_pks(request, admin, qs, config()["max_export_rows"])
    headers = ["pk", *columns]
    filename = f"{admin.model._meta.model_name}.{fmt}"

    def cells(obj):
        adapter = component("field_adapter")
        row = [obj.pk]
        for name in columns:
            field = admin.model._meta.get_field(name)
            value = adapter.serialize(field, obj)
            label = adapter.display(field, obj) if field.is_relation else None
            row.append(csv_cell(presentation(field, value, label)))
        return row

    ordered = chunked_objects(request, admin, qs, pks)
    if fmt == "xlsx":
        return xlsx_response(headers, ordered, cells, filename)
    response = StreamingHttpResponse(
        csv_stream(headers, ordered, cells), content_type="text/csv; charset=utf-8"
    )
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    return response


def chunked_objects(request, admin, qs, pks):
    """Повторная выборка пачками сохраняет порядок и select/prefetch."""
    mode = object_filter_mode(request, admin)
    policy = component("permission_policy")
    chunk = config()["chunk_size"]
    for start in range(0, len(pks), chunk):
        window = pks[start : start + chunk]
        found = {obj.pk: obj for obj in qs.filter(pk__in=window)}
        for pk in window:
            obj = found.get(pk)
            if obj is None:
                continue
            if mode == "object" and not policy.can_view_object(request, admin, obj):
                continue
            yield obj


def csv_stream(headers, objects, cells):
    yield "\ufeff"
    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(headers)
    yield buffer.getvalue()
    for obj in objects:
        buffer.seek(0)
        buffer.truncate()
        writer.writerow(cells(obj))
        yield buffer.getvalue()


def xlsx_response(headers, objects, cells, filename):
    import tempfile

    import openpyxl

    workbook = openpyxl.Workbook(write_only=True)
    sheet = workbook.create_sheet("sheet")
    sheet.append(headers)
    for obj in objects:
        sheet.append(cells(obj))
    temporary = tempfile.SpooledTemporaryFile()
    workbook.save(temporary)
    temporary.seek(0)
    return FileResponse(
        temporary,
        as_attachment=True,
        filename=filename,
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )


def read_table(uploaded):
    size = getattr(uploaded, "size", None)
    if size is not None and size > config()["max_import_bytes"]:
        raise SheetError("import_limit", _("Import file is too large."), status=413)
    name = (uploaded.name or "").lower()
    raw = uploaded.read(config()["max_import_bytes"] + 1)
    if len(raw) > config()["max_import_bytes"]:
        raise SheetError("import_limit", _("Import file is too large."), status=413)
    if name.endswith(".xlsx"):
        return read_xlsx(raw)
    try:
        text = raw.decode("utf-8-sig")
    except UnicodeError as exc:
        raise SheetError("invalid_import", _("Import file must be UTF-8 CSV or XLSX.")) from exc
    reader = csv.reader(io.StringIO(text))
    return list(reader)


def read_xlsx(raw):
    import io as bytesio

    try:
        import openpyxl
    except ImportError as exc:
        raise SheetError(
            "xlsx_unavailable",
            _("Install django-modelsheet[xlsx] to import Excel files."),
            status=415,
        ) from exc
    workbook = openpyxl.load_workbook(bytesio.BytesIO(raw), read_only=True, data_only=True)
    sheet = workbook.active
    rows = []
    limit = config()["max_import_rows"] + 1
    for index, row in enumerate(sheet.iter_rows(values_only=True)):
        if index > limit:
            raise SheetError("import_limit", _("Too many import rows."))
        rows.append(["" if value is None else str(value) for value in row])
    workbook.close()
    return rows


def records_from_table(table, mapping, model):
    if not table:
        raise SheetError("invalid_import", _("Import file is empty."))
    headers = [str(cell).strip() for cell in table[0]]
    if not headers or any(not header for header in headers) or len(headers) != len(set(headers)):
        raise SheetError("invalid_import", _("The header row must contain unique column names."))
    if not isinstance(mapping, dict) or not mapping:
        raise SheetError("invalid_import", _("Map at least one column."))
    if any(column not in headers for column in mapping):
        raise SheetError("invalid_import", _("Mapping refers to a missing column."))
    if "pk" not in mapping.values():
        raise SheetError("invalid_import", _("Map a column to pk."))
    fields = {name for name in mapping.values() if name != "pk"}
    unknown = [name for name in fields if not model_has_field(model, name)]
    if unknown:
        raise SheetError("invalid_import", _("Mapping refers to an unknown field."), field=unknown[0])
    records = []
    seen = set()
    limit = config()["max_import_rows"]
    for row in table[1:]:
        if not any(str(cell).strip() for cell in row):
            continue
        if len(records) >= limit:
            raise SheetError("import_limit", _("Too many import rows."))
        padded = list(row) + [""] * (len(headers) - len(row))
        data = {headers[index]: padded[index] for index in range(len(headers))}
        pk = str(data[next(column for column, target in mapping.items() if target == "pk")]).strip()
        if not pk or pk in seen:
            raise SheetError("invalid_import", _("Each import row needs a unique pk."))
        seen.add(pk)
        values = {}
        for column, target in mapping.items():
            if target == "pk":
                continue
            text = data[column]
            values[target] = "" if text is None else str(text).strip()
        records.append({"pk": pk, "values": values})
    if not records:
        raise SheetError("invalid_import", _("Import file has no data rows."))
    return records


def model_has_field(model, name):
    try:
        model._meta.get_field(name)
    except FieldDoesNotExist:
        return False
    return True
