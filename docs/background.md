# Background adapter contract

The package includes the worker entry point and persistent operation state, but
does not bundle a queue, broker, scheduler or Celery dependency. With no adapter,
operations over bulk_background_threshold fail before building a plan.

```python
from django.test import RequestFactory
from modelsheet.adapters import BackgroundAdapter

class ProjectBackgroundAdapter(BackgroundAdapter):
    def capture_context(self, request):
        # Include and validate your tenant/project context here.
        return {"tenant_id": request.tenant.pk}

    def restore_context(self, user, context):
        request = RequestFactory().post("/modelsheet-worker/")
        request.user = user
        request.tenant = load_authorized_tenant(user, context["tenant_id"])
        return request

    def enqueue(self, operation_id, phase):
        # Your durable task calls modelsheet.background.process(operation_id, phase).
        project_queue.enqueue("modelsheet.background.process", operation_id, phase)
```

Set `MODELSHEET['background_adapter']` to the adapter's dotted path. Never serialize
a Django request, queryset or pickled user into the queue. The entry point reloads
an active staff user and registered Admin, then reevaluates permissions and scope.

Phases are `preview` and `run`. A preview materializes its full candidate set and
values on the worker, then becomes ready for explicit confirmation. Confirmation
queues execution of those exact items. Delivery must be at least once; retries and
expired-worker recovery belong to the queue integration. Enqueue failure produces
`dispatch_failed` with an operation ID; resume retries dispatch.

Each worker claims a five-minute lease and a fencing token. Execution uses chunks;
each row's model write, audit item and completion marker share a transaction.
Completed items are never reapplied. After a crash, wait until the lease expires
before resuming; a monitor should requeue abandoned operations. A duplicate message
cannot execute an unconfirmed plan or rebuild an already completed preview.

Cancellation takes effect between chunks and preserves completed work. Resume
continues pending entries, not failed or completed entries. Conflict rows are
reported; corrections require a new preview. Synchronous execution is all-or-nothing;
background execution can finish partially. There is no automatic rollback of completed
chunks. External signals/actions need their own idempotency protocol.

Preview building currently materializes up to max_bulk_rows in worker memory and
uses one transaction to publish the plan. Size the limit for your model and database;
it is not a streaming engine for unlimited datasets. Aggregates use captured preview
inputs. A chunk checks current versions of its own target rows before writing.

The preview deadline is fixed when preparation completes. Cancel/resume and changes to `preview_ttl_seconds` never extend it. An expired unconfirmed plan returns `expired_preview` (409); create a new preview. Resuming an empty preview keeps its original empty membership. Already confirmed runs can resume after the deadline.
