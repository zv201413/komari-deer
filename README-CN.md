# Komari Deer

Komari Deer 是基于
[tonyliuzj/komari-next](https://github.com/tonyliuzj/komari-next)
二次开发的 Komari 自定义主题。

本项目保留 Komari-Next 的静态主题架构，并围绕紧凑暗色仪表盘、节点卡片、原版列表视图、地球可视化、背景图片设置和 Komari 主题打包流程进行定制。

[English](./README.md)

[演示站点](https://komari.deerstack.com)

## 来源与协议

本项目基于
[tonyliuzj/komari-next](https://github.com/tonyliuzj/komari-next)
开发，原项目作者为 Tony Liu。

原项目使用 MIT License。Komari Deer 继续使用 MIT License，并在 `LICENSE` 中保留原项目版权声明，同时补充本主题的版权说明。

## 功能特性

- 以紧凑暗色面板作为主主题
- 支持节点网格视图和列表视图
- 定制节点卡片，展示 CPU、内存、磁盘、流量、价格、到期时间、延迟和丢包信息
- 地球可视化，用于展示节点区域和连线
- 底部 IP 胶囊栏和返回顶部悬浮按钮
- 背景图片链接设置，支持背景模糊类型和模糊强度
- 基于 `react-i18next` 的国际化
- 适配 Komari 主题上传的静态导出打包

## 技术栈

- **框架：** Next.js App Router，静态导出
- **语言：** TypeScript、React
- **UI：** Tailwind CSS、Shadcn UI、Radix UI primitives
- **图表：** Recharts
- **地球：** globe.gl、d3-geo、topojson-client
- **数据：** Komari RPC2 API 与浏览器 fetch API

## 前置要求

- Node.js 22 或更高版本
- 一个浏览器可访问的 Komari 后端

## 本地开发

安装依赖：

```bash
npm install
```

在项目根目录创建 `.env.local`，并指向你的 Komari 后端：

```env
NEXT_PUBLIC_API_TARGET=http://127.0.0.1:25774
```

启动开发服务器：

```bash
npm run dev
```

然后在浏览器打开 `http://localhost:3000`。

## 构建与打包

本主题使用 Next.js 静态导出，构建产物会输出到 `dist/`。

```bash
npm run build
```

如果要制作可上传到 Komari 的主题包，需要将生成的静态文件与 `komari-theme.json` 以及 Komari 主题系统需要的资源一起打包。

多图、视频和玻璃效果的独立背景脚本及配置约定见
[背景运行时规格](./docs/APPEARANCE-SCRIPT-SPEC.md)。

登录与保留的编辑组件支持回车提交保存或确认；备注等多行输入仍用回车换行。
相关交互由 `src/utils/defaultEnter.ts` 统一处理，与默认前端保持相同策略。

## 脚本

- `npm run dev` - 启动 Next.js 开发服务器
- `npm run build` - 将静态站点构建到 `dist/`
- `npm run lint` - 运行 ESLint
- `npm run i18n:sync` - 同步国际化键值

## 鸣谢

- [tonyliuzj/komari-next](https://github.com/tonyliuzj/komari-next)，本主题基于该原项目开发
- [komari-monitor/komari](https://github.com/komari-monitor/komari)
