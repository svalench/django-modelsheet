---
template: playground.html
hide:
  - navigation
  - toc
---

# 试用交互式表格

直接编辑单元格、输入公式并立即查看结果，无需安装或注册。此演示复用软件包的 **Tabulator 表格、编辑缓冲区和 Decimal 公式引擎**。

<div id="modelsheet-live-demo">正在加载交互式表格…</div>

<noscript>此演示需要 JavaScript，请启用后编辑示例表格。</noscript>

## 三个体验场景

1. **编辑价格。** 双击 B1，输入 `1500`，按 Enter，库存金额会更新。撤销可恢复原值。
2. **输入公式。** 选择 B1，在公式栏输入 `=ROUND([price]*1.07,2)` 并点击**应用**。也可点击**涨价 7%** 同时修改全部六行。
3. **引用其他单元格。** 在 B1 输入 `=ROUND(AVG(B2:B6),2)`，再修改 B2，B1 会重新计算。输入 `=1/0` 可查看公式错误；**在演示中保存**会保留全部待修改内容，直到错误修正。

支持区域选择、从电子表格粘贴 TSV 和向下填充。表格获得焦点时，Ctrl/Cmd+Z 撤销、Ctrl/Cmd+Y 重做、Ctrl/Cmd+S 保存。小屏幕可横向滚动表格或使用公式栏。

## 沙盒行为

- `[price]`、`[stock]` 读取上次演示保存时的原始行值；`B1` 和区域引用读取待保存更改。
- **在演示中保存**验证所有示例行，将计算结果保存在内存并清除撤销历史，不写入数据库或浏览器存储。
- 价格须非负且小于 100 亿；库存须为 0 至 1,000,000 的整数。名称不能为空、不能重复且不超过 100 字符。状态为 `ready` 或 `order`，可在 D 列输入 `=IF([stock]>0,"ready","order")`。
- **重置数据**恢复六件初始商品。刷新或切换语言也会重置演示。

!!! info "仅前端沙盒，不是 Django 后端"
    此处演示编辑与计算。Django 权限、数据库约束、行锁、审计历史和后台操作需要安装完整软件包，这里不会模拟，不能用于验证持久化或安全机制。

[接入项目 →](guide/quickstart.md){ .md-button .md-button--primary }
[查看公式示例](guide/formulas.md){ .md-button }

[捆绑依赖许可证](assets/playground/THIRD_PARTY_LICENSES.txt)。
