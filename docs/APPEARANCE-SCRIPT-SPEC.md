# komari-appearance.js 规格（v1）

本文归属 Komari Deer 的主题背景运行时；独立脚本也可供其他主题复用。
实现位于 [`public/komari-appearance.js`](../public/komari-appearance.js)，
接入点位于 [`src/app/layout.tsx`](../src/app/layout.tsx)。
默认主题的行为参考位于同级仓库 `komari-web_new`，它使用 React 组件实现背景系统。

> 目的：把 fork 默认主题的背景系统抽成**无框架依赖的独立脚本**，任何第三方主题
> 加一个 `<script>` + 在 komari-theme.json 声明配置键即可获得同款能力。
> 参考实现：komari-web_new `src/components/AppearanceRuntime.tsx` + `src/config/parse.ts`（行为必须对齐）。

## 形态
- 单文件 IIFE，纯浏览器 ES2018，零依赖，无构建步骤；文件名 `komari-appearance.js`
- 由主题的 index.html 以 `<script defer src="...">` 引入；`DOMContentLoaded` 后初始化
- 幂等：重复引入只初始化一次（window.__komariAppearance 标记）

## 数据来源
1. `fetch("/api/public")` → 响应为 `{ status, data }` 包裹（若无 data 字段则直接用响应对象，两种都兼容）
2. 取 `data.theme_settings`（对象，可能缺失 → 视为 {}）
3. 与内置默认值合并：
   - backgroundImage: "", backgroundImageMobile: ""
   - backgroundImages: "[]", backgroundImagesMobile: "[]"
   - backgroundAlignment: "cover,top"
   - videoBackgroundAlignment: ""（空回退 backgroundAlignment）
   - enableVideoBackground: false, videoBackgroundUrl: "", videoBackgroundUrlMobile: ""
   - blurBackgroundColor: ""（"light|dark" 形式）, blurValue: 10
   - mainWidth: 85

## 行为（与 AppearanceRuntime 逐条对齐）
1. **横竖屏/移动端**：`isMob = window.innerHeight > window.innerWidth`（竖屏即视为移动场景）。
   isMob 且 backgroundImagesMobile 非 "[]" → 用移动列表；否则桌面列表。
   单图回退同理（backgroundImageMobile → backgroundImage）。
2. **多图解析**（对齐 parseBackgroundImages）：JSON 数组，元素为 string（纯 URL）或
   `{url, size?, position?}`；非法元素剔除，解析失败得 []。
3. **随机选图**：列表非空时随机抽一张。随机值按"列表 URL 拼接键"缓存——resize/横竖屏
   切换若列表内容没变则不重摇；刷新页面自然重摇（=刷新换图）。
4. **light|dark 双图**：URL 含 "|" 时按当前明暗取第 0/1 段。明暗判定顺序：
   `document.documentElement.classList.contains("dark")` → `[data-theme="dark"]` →
   `prefers-color-scheme`。并用 MutationObserver 监听 html class/data-theme 变化即时切换。
5. **对齐回退**：选中图的 size/position 逐字段回退到 backgroundAlignment 解析值
   （"size,position" 逗号分割 trim）。
6. **视频层**：enableVideoBackground 且 URL 非空才渲染；移动端优先 videoBackgroundUrlMobile；
   object-fit 白名单收敛（fill/contain/cover/none/scale-down，否则 cover），
   videoBackgroundAlignment 空回退 backgroundAlignment；autoplay/loop/muted/playsinline。
7. **DOM 结构**（插入 body 末尾）：
   ```html
   <div id="komari-appearance-bg" style="position:fixed;inset:0;z-index:-10;overflow:hidden;pointer-events:none">
     <div data-layer="image" style="position:absolute;inset:0;background-repeat:no-repeat;背景图/size/position 动态"></div>
     <video data-layer="video" ...>（按需）</video>
   </div>
   ```
8. **CSS 变量注入**（:root 上，主题可选消费做玻璃效果）：
   `--body-background-url`、`--purcarte-blur`（px）、`--card-light`、`--card-dark`、`--main-width`（vw）
   （blurBackgroundColor 按 "|" 拆 light/dark，单段两者同值）
9. **resize 监听**：横竖屏翻转时重新选列表（遵守第 3 条的锁定规则）。

## 主题适配约定（写进 README）
- index.html 引脚本；主题自身的 body/根容器背景改为透明（适配时可能需要一小段覆盖 CSS）
- komari-theme.json 的 managed data 里声明以下键（这样 fork 后台的多图编辑器自动可用）：
  backgroundImages(multi-image)、backgroundImagesMobile(multi-image)、backgroundAlignment(string)、
  backgroundImage(string)、backgroundImageMobile(string)、enableVideoBackground(switch)、
  videoBackgroundUrl(string)、videoBackgroundUrlMobile(string)、videoBackgroundAlignment(string)、
  blurBackgroundColor(string)、blurValue(number)
- 声明模板可从 fork 默认主题的 komari-theme.json 抄对应段落

## 验收
- 无背景配置时零可见变化（容器空转即可，不许报错）
- /api/public 失败时静默降级（console.warn 一条，不阻塞主题）
- 脚本体积 < 10KB 未压缩
