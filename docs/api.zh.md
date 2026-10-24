# HTTP API

路径相对于 `/admin/<app>/<model>/sheet/`。所有端点使用 Admin 会话和权限检查；修改需提供 CSRF 与 `application/json`。响应包含 `Cache-Control: no-store`。

## 读取数据

`GET schema/` 返回可见字段、可编辑性、安全的虚拟列和功能信息。

`GET rows/` 接受 `q`、JSON `filter`、JSON `sort`、`offset`、`limit` 和 JSON `columns`（可见字段顺序）。响应包括 `{pk,version,values}` 行、snapshot、规范化状态、UTC today、count（或 null）和 has_next。

```json title="筛选示例"
{"and":[{"field":"stock","op":"lt","value":10},{"field":"status","op":"eq","value":"ready"}]}
```

支持 AND/OR 分组和 `eq, ne, lt, lte, gt, gte, in, not_in, isnull, contains`。禁止 ORM 路径和任意 lookup。排序示例：`[{"field":"price","dir":"desc"}]`；自动追加主键以稳定排序。

## 保存

`POST save/`：

```json
{
  "snapshot":"snapshot-uuid",
  "view_state":{"q":"","filter":{},"sort":[],"offset":0,"limit":200,"columns":["name","price"]},
  "idempotency_key":"client-generated-unique-key",
  "changes":[{"pk":"42","version":"loaded-row-fingerprint","values":{"price":"=[price]*1.07"}}]
}
```

使用实际加载所得的快照、状态和版本。每行只能出现一次，该行所有字段一起验证；请求整体原子化。记录由 PK 而非行号识别，Decimal 使用字符串，日期使用 ISO 8601。未知和禁止字段明确拒绝。

响应丢失时重发相同请求与相同幂等键。同键不同内容返回 409。操作被清理后，旧键超出幂等保留窗口。

## 批量计划

`POST bulk/preview/` 接受 `{idempotency_key,state,assignments,selection,snapshot}`。`state` 与 rows 的查询规则相同。`assignments` 将可编辑字段映射为常量或表达式。`selection` 为 null 表示全部匹配行，为 PK 列表时表示指定快照中的行。预览不修改业务模型。

`POST bulk/run/` 接受 `{"operation":"operation-uuid"}`，明确确认不可变计划。重复调用不会重复产生效果。

## 报告与控制

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `operations/<uuid>/?offset=0` | 状态、计数、最多 200 个可见项 |
| POST | `operations/<uuid>/cancel/` | `{}`，仅作者可取消 |
| POST | `operations/<uuid>/resume/` | `{}`，仅作者可恢复 |
| GET | `history/?offset=0` | 最多 20 项操作，需历史权限 |

逐项分页使用 `next_offset`，即使行被权限隐藏也有效。before/after 只含当前可见字段。读取其他用户的操作需要历史权限。

## 错误

格式：`{error:{code,message,pk?,field?,details?}}`。无法可靠映射到字段的约束错误附在行上。

| 状态 | 含义 |
| --- | --- |
| 400 | 解析或验证错误 |
| 403 | 权限不足 |
| 404 | 操作或模型不可用 |
| 409 | 版本、快照、确认或幂等冲突 |
| 413 | 请求过大 |
| 429 | 频率限制 |
| 503 | 数据库忙、队列或配置问题 |

保存失败后，客户端应保留本地更改。
