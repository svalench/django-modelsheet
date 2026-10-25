# 性能基准

```bash
python scripts/benchmark.py --rows 100000 --repeats 10
python scripts/benchmark.py --rows 1000000 --repeats 10
```

脚本创建独立临时 SQLite 数据库，包含 50 个数据列，填充数据后测量第 1 页和第 5 页的 200 行窗口、精确索引筛选与子串搜索。输出 Python/Django/平台、数据量、SQL 次数、median/p95 与填充时间，结束后删除数据库。

比较机器时同时记录 CPU、内存和存储。不要把子串搜索与索引等值查询直接比较。通用子串搜索没有普适的亚秒保证。PostgreSQL/MySQL 的生产基准需要真实索引、排序规则、查询形态、硬件和代表性数据。

浏览器 E2E 另有 100k 结果、50 列、加载 200 行的 fixture，记录滚动帧间隔和 DOM 行数上界；并非把 100k 行都装入浏览器。API 延迟和滚动延迟测量不同层面。

结果见[验证报告](validation.md)。

`python scripts/benchmark_bulk.py --rows 100 500 1000 --repeats 3` 在独立临时
SQLite 数据库中测量包含 `QSUM` 和重复 `QCOUNT` 调用的完整批量预览。
脚本比较同一计划构建器启用与禁用聚合缓存的情况，报告预览中位耗时和聚合访问的值数。
这用于隔离缓存效果，并非版本间比较。对固定公式集合，启用缓存后的访问次数随行数线性增长。
脚本根据数据量调整公式步数限制，不修改生产配置；计时包含模型验证与数据库写入。
