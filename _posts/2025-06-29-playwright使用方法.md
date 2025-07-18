# 本次使用 Playwright + Python 爬取 Street Fighter 6 Ryu 帧数据 完整教程

> **目标**：自动获取 Street Fighter 官网 Ryu 角色帧数据表格，解析两级表头+分类列，并导出 CSV。  
> **技术栈**：Playwright、BeautifulSoup、Pandas。

---

## 一、环境准备

```bash
# 安装 Playwright 与相关 Python 包，这个可以单独装在虚拟环境
pip install playwright pandas 

# 下载浏览器，浏览器默认下载在用户空间下，全部虚拟环境可以共用
playwright install
# 或者只装 Chromium： playwright install chromium
```

> 提示  
	•	确保 Python 环境（虚拟环境或全局）已激活。  
	•	playwright install 会把浏览器二进制放在 ~/.cache/ms-playwright。但有时也会例外，
        比如最新的 mac 放的位置就不一样，可以通过命令python 脚本打印各个目录
```python 
from playwright.sync_api import sync_playwright

# 打印各个目录
with sync_playwright() as p:
print("Chromium:", p.chromium.executable_path)
print("Firefox:", p.firefox.executable_path)
print("WebKit:", p.webkit.executable_path)
```

--- 
## 二、脚本结构预览  
scrape_frame_data_playwright.py  
├── 环境导入  
├── scrape_frame_data() 函数  
│   ├── 启动 Playwright + 浏览器上下文（伪装 UA）  
│   ├── page.goto + 等待 DOM 渲染  
│   ├── JS 提取两级表头 → headers  
│   ├── JS 提取数据行并插入分类列 → rows  
│   └── 关闭浏览器  
├── Pandas 构建 MultiIndex DataFrame  
├── 导出 ryu_frame_data.csv  
└── __main__ 调用  

 ---

## 三、脚本实现

```python   
from playwright.sync_api import sync_playwright
import pandas as pd


def scrape_frame_data():
    url = "https://www.streetfighter.com/6/zh-hans/character/ryu/frame"

    with sync_playwright() as p:
        # 1. 启动浏览器
        browser = p.chromium.launch(headless=True)

        ## 如果不添加这个参数，页面会返回 403
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                       "AppleWebKit/537.36 (KHTML, like Gecko) "
                       "Chrome/115.0.0.0 Safari/537.36",
            extra_http_headers={
                "referer": "https://www.streetfighter.com/",
                "accept-language": "zh-CN,zh;q=0.9",
            }
        )
        page = context.new_page()

        page.goto(url, wait_until="domcontentloaded", timeout=60000)
        page.wait_for_selector("div#framearea table", timeout=120000)

        # 3. 提取两级表头 (parent, child) 列表
        headers = page.evaluate("""
() => {
  const headers = [];
  const ths = Array.from(document.querySelectorAll('div#framearea table thead th'));
  for (const th of ths) {
    // 父级标题：首个文本节点 or <label> or 整体文本
    const parent = Array.from(th.childNodes)
      .find(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim())?.textContent.trim()
      || th.querySelector('label')?.textContent.trim()
      || th.textContent.trim();

    // 查找子级 li
    const lis = th.querySelectorAll('ul li');
    if (lis.length) {
      lis.forEach(li => {
        const labelTag = li.querySelector('label');
        const child = labelTag
          ? labelTag.textContent.trim()
          : Array.from(li.childNodes)
              .find(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim())?.textContent.trim()
              || "";
        headers.push([parent, child]);
      });
    } else {
      headers.push([parent, ""]);
    }
  }
  return headers;
}
""")

        # 4. 提取所有数据行，并插入分类列
        rows = page.evaluate("""
() => {
  const data = [];
  let currentCat = null;
  const trs = document.querySelectorAll('div#framearea table tbody tr');
  trs.forEach(tr => {
    // 读取每个单元格，优先 span，再 p，最后纯文本
    const texts = Array.from(tr.querySelectorAll('td')).map(td => {
      const span = td.querySelector('span');
      if (span && span.textContent.trim()) return span.textContent.trim();
      const p = td.querySelector('p');
      if (p && p.textContent.trim()) return p.textContent.trim();
      return td.textContent.trim();
    });
    // 只有一项视为分类
    if (texts.length === 1) {
      currentCat = texts[0];
    } else {
      data.push([currentCat, ...texts]);
    }
  });
  return data;
}
""")

        browser.close()

    # 5. 构造 DataFrame 并保存
    # 在表头最前面插入 Category 列
    flat_headers = [("Category", "")] + [tuple(h) for h in headers]
    mi = pd.MultiIndex.from_tuples(flat_headers, names=["一级", "二级"])
    df = pd.DataFrame(rows, columns=mi)
    df.to_csv("ryu_frame_data_with_category.csv", index=False, encoding="utf-8-sig")
    print("已保存：ryu_frame_data_with_category.csv")


if __name__ == "__main__":
    scrape_frame_data()
```

### 核心脚本解释

1. **启动 Playwright 与浏览器上下文**  
   ```python
   browser = p.chromium.launch(headless=True)
   context = browser.new_context(...)
   page = context.new_page()
   ```
   - `headless=True` 表示无头模式运行。 不开启窗口，可以方便在无图形驱动的服务器运行。 
   - 通过 `user_agent` 和 `extra_http_headers` 伪装请求，避免返回 403。

2. **打开页面并等待渲染**  
   ```python
   page.goto(url, wait_until="domcontentloaded", timeout=60000)
   page.wait_for_selector("div#framearea table", timeout=60000)
   ```
   - `"domcontentloaded"` 等待 HTML 和内联脚本执行完毕。  
   - `wait_for_selector` 确认目标元素已插入 DOM。

3. **提取两级表头**  
   ```python
   headers = page.evaluate("...JS 逻辑...")
   ```
   - 在浏览器上下文执行 JavaScript，遍历 `<thead>` 中的每个 `<th>`。  
   - 提取父级标题文本；检查 `<ul><li>` 结构获取子级标题。

4. **提取分类与数据行**  
   ```python
   rows = page.evaluate("...JS 逻辑...")
   ```
   - 遍历 `<tbody>` 中的每个 `<tr>`：  
     - 若只有一个 `<td>`，则记录为分类 (`currentCat`)；  
     - 否则读取每个单元格文本（优先 `<span>`、其次 `<p>`、再纯文本），并在行首插入当前分类。

5. **构建 DataFrame 并导出 CSV**  
   ```python
   flat_headers = [("Category","")] + [tuple(h) for h in headers]
   mi = pd.MultiIndex.from_tuples(flat_headers, names=["一级","二级"])
   df = pd.DataFrame(rows, columns=mi)
   df.to_csv("ryu_frame_data.csv", index=False, encoding="utf-8-sig")
   ```
   - 使用 `MultiIndex` 保留两级表头和分类列。  
   - 最终 CSV 包含完整的一级/二级表头及数据。


## 四、踩坑 & 小结

- **403 错误**：默认 Headless UA 被识别，需伪装真实浏览器 UA，以及添加 `Referer`、`Accept-Language` 等请求头。  
- **Headless 渲染慢**：Headless 模式禁用 GPU，加上 WebDriver 协议通信开销，速度比较慢，需要增加等待时间。  
- **资源拦截**：CSR 页面需要加载 `script`、`xhr` 才能生成动态内容；SSR 页面则可只保留 `document`。  
- **三引号缩进**：Python 三引号保留空白，JS 执行不受影响，但可用 `textwrap.dedent` 优化可读性。  
- **等待策略**：SSR 用 `domcontentloaded`；CSR 可补显式等待关键元素，避免 `networkidle` 超时。
