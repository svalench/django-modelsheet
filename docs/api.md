# HTTP API

Routes are relative to `/admin/<app>/<model>/sheet/`. All endpoints use Admin
sessions and permission checks. Mutations require CSRF and `application/json`.
Responses have `Cache-Control: no-store`.

`GET schema/` returns visible concrete fields, editability, safe virtual columns and capabilities.
`GET rows/` accepts `q`, JSON `filter`, JSON `sort`, `offset`, `limit`, and JSON
`columns` (displayed field order). It returns rows `{pk,version,values}`, snapshot,
normalized state, UTC today, count (or null) and has_next.

```json
{"and":[{"field":"stock","op":"lt","value":10},{"field":"status","op":"eq","value":"ready"}]}
```

Filters allow AND/OR groups and eq, ne, lt, lte, gt, gte, in, not_in, isnull,
contains. They cannot contain ORM paths or custom lookups. Sort is a list such as
`[{"field":"price","dir":"desc"}]`; PK is an additional stable order.

```json
{
  "snapshot":"snapshot-uuid",
  "view_state":{"q":"","filter":{},"sort":[],"offset":0,"limit":200,"columns":["name","price"]},
  "idempotency_key":"client-generated-unique-key",
  "changes":[{"pk":"42","version":"loaded-row-fingerprint","values":{"price":"=[price]*1.07"}}]
}
```

POST this to `save/`. Each row appears once; all fields are validated together;
the request is atomic. Submit the exact same body and idempotency key after a lost
response. Reusing a key with different content is a 409 conflict. Retrying after an
operation is purged is outside the idempotency retention window.

`POST bulk/preview/` accepts `{idempotency_key,state,assignments,selection,snapshot}`.
Selection is null for all matching rows, or a list of PKs from the supplied snapshot.
Assignments map editable field names to scalar constants or expressions. State
uses the same filters/search/order as rows. Preview is read-only for user models.

`POST bulk/run/` accepts `{operation: "operation-uuid"}`; this is the explicit
confirmation of an immutable plan. Repeated calls do not repeat its effects.
`GET operations/<uuid>/?offset=0` returns counters, status and up to 200 visible
items. Each item includes before/after for currently visible fields only.
Use next_offset for subsequent item pages; it remains valid when row access hides items.
`POST operations/<uuid>/cancel/` and `/resume/` accept `{}` and are owner-only.
`GET history/?offset=0` returns up to 20 operations and requires history permission.
Reading another user's operation also requires history permission.

Errors are `{error:{code,message,pk?,field?,details?}}`. Typical statuses:
400 parse/validation, 403 permission, 404 unavailable operation/model, 409 version,
snapshot, confirmation or idempotency conflict, 413 payload size, 429 rate limit,
503 busy database/queue/configuration. Constraint errors without a reliable field
mapping attach to the row. Clients retain edits after any failed save.
