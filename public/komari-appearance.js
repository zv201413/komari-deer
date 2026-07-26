/*!
 * komari-appearance.js (v1) — 无框架依赖的独立背景运行时。
 * 主题引入本脚本 + 在 komari-theme.json 声明约定键，即获得默认主题同款背景：
 * 多图随机轮换 / light|dark 双图 / 移动端专用图 / 视频背景 / 毛玻璃 CSS 变量。
 * 行为对齐 komari-web AppearanceRuntime.tsx + config/parse.ts。IIFE，ES2018，零依赖，幂等。
 */
(function () {
  "use strict";

  if (window.__komariAppearance) return;
  window.__komariAppearance = true;

  var DEFAULTS = {
    backgroundImage: "",
    backgroundImageMobile: "",
    backgroundImages: "[]",
    backgroundImagesMobile: "[]",
    backgroundAlignment: "cover,top",
    videoBackgroundAlignment: "",
    enableVideoBackground: false,
    videoBackgroundUrl: "",
    videoBackgroundUrlMobile: "",
    blurBackgroundColor: "",
    blurValue: 10,
    mainWidth: 85
  };

  var DEFAULT_ALIGNMENT = "cover,top";
  var OBJECT_FIT = ["fill", "contain", "cover", "none", "scale-down"];
  var ACTIVE_CLASS = "komari-appearance-active";

  // 随机选图锁定：按列表 URL 拼接键缓存随机值。resize / 横竖屏切换若列表内容没变则复用
  // （不重摇）；刷新页面自然重置（= 刷新换图）。
  var randomPick = { key: "", rand: Math.random() };

  var config = null;
  var els = null; // { container, image, video }
  var observer = null;

  /* --- 解析工具 --- */

  function bool(v) {
    return v === true || v === "true";
  }

  function num(v, fallback) {
    var n = typeof v === "number" ? v : parseFloat(v);
    return isFinite(n) ? n : fallback;
  }

  // 解析 "size,position" 对齐字符串。
  function parseAlignment(value) {
    var parts = String(value || DEFAULT_ALIGNMENT).split(",");
    return {
      size: (parts[0] || "").trim(),
      position: parts[1] != null ? parts[1].trim() : undefined
    };
  }

  // 解析 backgroundImages（JSON 数组）。元素为纯 URL（可含 light|dark）或 { url, size?, position? }；
  // 非法元素剔除，解析失败返回 []。
  function parseBackgroundImages(json) {
    var arr;
    try {
      arr = JSON.parse(json || "[]");
    } catch (e) {
      return [];
    }
    if (!Array.isArray(arr)) return [];
    var out = [];
    for (var i = 0; i < arr.length; i++) {
      var it = arr[i];
      if (typeof it === "string") {
        if (it) out.push({ url: it });
      } else if (it && typeof it === "object" && typeof it.url === "string") {
        out.push({
          url: it.url,
          size: typeof it.size === "string" && it.size ? it.size : undefined,
          position: typeof it.position === "string" && it.position ? it.position : undefined
        });
      }
    }
    return out;
  }

  // 解析 "light|dark" 毛玻璃底色；单段时亮暗同值。
  function parseGlassColors(value) {
    var colors = String(value || "").split("|").map(function (c) { return c.trim(); });
    if (colors.length >= 2) return { light: colors[0], dark: colors[1] };
    return { light: colors[0] || "", dark: colors[0] || "" };
  }

  // 收敛为合法 object-fit，避免视频取到非法值静默失效。
  function toObjectFit(size) {
    return OBJECT_FIT.indexOf(size) >= 0 ? size : "cover";
  }

  // 明暗判定：html.classList "dark"→"light" → data-theme=dark/light → 任意 [data-theme=dark]
  // → prefers-color-scheme。
  function isDark() {
    var de = document.documentElement;
    if (de.classList.contains("dark")) return true;
    if (de.classList.contains("light")) return false;
    var dt = de.getAttribute("data-theme");
    if (dt === "dark") return true;
    if (dt === "light") return false;
    if (document.querySelector('[data-theme="dark"]')) return true;
    return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  }

  // URL 含 "|" 时按明暗取第 0/1 段。
  function resolvePipe(urls) {
    if (!urls) return "";
    var list = String(urls).split("|").map(function (u) { return u.trim(); });
    if (list.length > 1) return isDark() ? list[1] : list[0];
    return list[0];
  }

  /* --- 计算图层 --- */

  function computeImage() {
    var fallback = parseAlignment(config.backgroundAlignment);
    var isMob = window.innerHeight > window.innerWidth; // 竖屏视为移动场景

    var multi = isMob && config.backgroundImagesMobile && config.backgroundImagesMobile !== "[]"
      ? config.backgroundImagesMobile
      : config.backgroundImages;
    var single = isMob && config.backgroundImageMobile
      ? config.backgroundImageMobile
      : config.backgroundImage;

    var entries = parseBackgroundImages(multi);
    if (entries.length > 0) {
      var listKey = entries.map(function (e) { return e.url; }).join("|");
      if (randomPick.key !== listKey) {
        randomPick = { key: listKey, rand: Math.random() };
      }
      var picked = entries[Math.floor(randomPick.rand * entries.length)];
      return {
        url: resolvePipe(picked.url),
        size: picked.size || fallback.size,
        position: picked.position || fallback.position
      };
    }
    return {
      url: resolvePipe(single || ""),
      size: fallback.size,
      position: fallback.position
    };
  }

  function computeVideo() {
    if (!bool(config.enableVideoBackground)) return null;
    var isMob = window.innerHeight > window.innerWidth;
    var url = isMob && config.videoBackgroundUrlMobile
      ? resolvePipe(config.videoBackgroundUrlMobile)
      : resolvePipe(config.videoBackgroundUrl);
    if (!url) return null;
    var align = parseAlignment(config.videoBackgroundAlignment || config.backgroundAlignment);
    return { url: url, fit: toObjectFit(align.size), position: align.position };
  }

  /* --- DOM --- */

  function ensureDom() {
    if (els) return;
    var container = document.createElement("div");
    container.id = "komari-appearance-bg";
    container.style.cssText =
      "position:fixed;inset:0;z-index:-10;overflow:hidden;pointer-events:none;";

    var image = document.createElement("div");
    image.setAttribute("data-layer", "image");
    image.style.cssText =
      "position:absolute;inset:0;background-repeat:no-repeat;";

    container.appendChild(image);
    document.body.appendChild(container);
    els = { container: container, image: image, video: null };
  }

  function render() {
    if (!config) return;
    ensureDom();

    var img = computeImage();
    var vid = computeVideo();

    els.image.style.backgroundImage = img.url ? 'url("' + img.url + '")' : "";
    els.image.style.backgroundSize = img.size || "";
    els.image.style.backgroundPosition = img.position || "";

    // 视频层（按需创建/移除）
    if (vid) {
      if (!els.video) {
        var v = document.createElement("video");
        v.setAttribute("data-layer", "video");
        v.autoplay = true;
        v.loop = true;
        v.muted = true;
        v.playsInline = true;
        v.setAttribute("muted", "");
        v.setAttribute("playsinline", "");
        v.style.cssText = "position:absolute;inset:0;width:100%;height:100%;";
        els.container.appendChild(v);
        els.video = v;
      }
      if (els.video.getAttribute("src") !== vid.url) {
        els.video.setAttribute("src", vid.url);
      }
      els.video.style.objectFit = vid.fit;
      els.video.style.objectPosition = vid.position || "";
    } else if (els.video) {
      els.container.removeChild(els.video);
      els.video = null;
    }

    // CSS 变量（:root，主题可选消费）
    var glass = parseGlassColors(config.blurBackgroundColor);
    var de = document.documentElement;
    de.style.setProperty("--main-width", num(config.mainWidth, 85) + "vw");
    de.style.setProperty("--body-background-url", "url(" + img.url + ")");
    de.style.setProperty("--purcarte-blur", num(config.blurValue, 10) + "px");
    de.style.setProperty("--card-light", glass.light);
    de.style.setProperty("--card-dark", glass.dark);

    // 渲染了可见背景时给 html 打标记，主题据此把不透明 body 改透明露出本层。
    // 仅在状态翻转时动 class，避免自身改动触发下方 MutationObserver 回环。
    var wantActive = !!(img.url || vid);
    var hasActive = de.classList.contains(ACTIVE_CLASS);
    if (wantActive && !hasActive) de.classList.add(ACTIVE_CLASS);
    else if (!wantActive && hasActive) de.classList.remove(ACTIVE_CLASS);
  }

  /* --- 初始化 --- */

  function mergeConfig(themeSettings) {
    var out = {};
    for (var k in DEFAULTS) {
      if (Object.prototype.hasOwnProperty.call(DEFAULTS, k)) {
        out[k] = themeSettings && themeSettings[k] !== undefined ? themeSettings[k] : DEFAULTS[k];
      }
    }
    return out;
  }

  function bindListeners() {
    // 横竖屏翻转时重选列表（遵守随机锁定）。
    var resizeTimer = null;
    window.addEventListener("resize", function () {
      if (resizeTimer) return;
      resizeTimer = window.setTimeout(function () {
        resizeTimer = null;
        render();
      }, 100);
    });

    // 监听 html class / data-theme 变化，即时切换 light|dark 图。
    observer = new MutationObserver(function () { render(); });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"]
    });

    if (window.matchMedia) {
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      var onChange = function () { render(); };
      if (mq.addEventListener) mq.addEventListener("change", onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }
  }

  function init() {
    fetch("/api/public")
      .then(function (r) { return r.json(); })
      .then(function (resp) {
        var data = resp && resp.data !== undefined ? resp.data : resp;
        var themeSettings = (data && data.theme_settings) || {};
        config = mergeConfig(themeSettings);
        render();
        bindListeners();
      })
      .catch(function (e) {
        console.warn("[komari-appearance] failed to load /api/public:", e);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
