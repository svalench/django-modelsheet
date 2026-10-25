# 后台任务

软件包提供 worker 入口和持久化操作状态，不附带队列、broker、调度器或 Celery 依赖。未配置适配器时，超出 `bulk_background_threshold` 的操作在建立计划前拒绝。

## 项目适配器

```python title="集成示例：需实现项目函数"
from django.test import RequestFactory
from modelsheet.adapters import BackgroundAdapter

# 从项目中导入 load_authorized_tenant 和 project_queue。

class ProjectBackgroundAdapter(BackgroundAdapter):
    def capture_context(self, request):
        return {"tenant_id": request.tenant.pk}

    def restore_context(self, user, context):
        request = RequestFactory().post("/modelsheet-worker/")
        request.user = user
        request.tenant = load_authorized_tenant(user, context["tenant_id"])
        return request

    def enqueue(self, operation_id, phase):
        project_queue.enqueue(
            "modelsheet.background.process", operation_id, phase
        )
```

将 `MODELSHEET["background_adapter"]` 设为适配器类路径。这是契约示例，不是现成队列驱动；需实现授权租户加载和持久任务投递。

## 恢复访问上下文

不要序列化 Django request、queryset 或 pickled 用户。只保存必要上下文。入口重新加载 active staff 用户、已注册 Admin，重新检查权限和范围；无法恢复上下文时应拒绝任务。

## 两个阶段

`preview` 在 worker 中固定完整候选集合和值，完成后等待明确确认。确认后，`run` 执行这些固定项。队列需提供至少一次投递；重试与过期恢复由项目实现。

入队失败返回 `dispatch_failed` 和操作 ID；恢复会重试入队。

## Lease 与重试

worker 获取五分钟 lease 和 fencing token。每行的业务写入、审计项和完成标记共同提交；完成项不重复应用。崩溃后先等待 lease 过期再恢复，监控器应重新入队遗弃操作。重复消息不能执行未确认计划或重建已完成预览。

## 取消与部分完成

取消在批次之间生效，保留已完成工作。恢复只处理未完成项，不处理失败或已完成项。冲突行需新预览。同步执行全成或全败，后台可部分完成，不自动回滚已提交批次。信号等外部副作用需自行保证幂等。

## 资源限制

预览当前会在 worker 内存中物化最多 `max_bulk_rows`，并用一个事务发布计划；不是无限数据流引擎。应根据模型和数据库设置上限。聚合基于预览保存的输入；每个写入批次检查自身目标记录的当前版本。

预览截止时间在准备完成时固定。取消、恢复以及修改 `preview_ttl_seconds` 均不会延长截止时间。过期且未确认的计划返回 `expired_preview`（409），需要重新预览。恢复空预览会保留原始空记录集。已确认的任务在截止时间后仍可恢复执行。
