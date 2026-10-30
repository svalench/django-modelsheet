class SheetError(Exception):
    def __init__(self, code, message, *, status=400, pk=None, field=None, details=None):
        super().__init__(message)
        self.code, self.message, self.status = code, message, status
        self.pk, self.field, self.details = pk, field, details

    def as_dict(self):
        return {
            k: v
            for k, v in {
                "code": self.code,
                "message": str(self.message),
                "pk": self.pk,
                "field": self.field,
                "details": self.details,
            }.items()
            if v is not None
        }
