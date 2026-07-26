import type { Metadata } from "next";
import Script from "next/script";
import "@/global.css";
import { Providers } from "@/components/providers";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import RemainingValueCalculator from "@/components/RemainingValueCalculator";

export const metadata: Metadata = {
  title: "Komari Monitor",
  description: "A simple server monitor tool.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground min-h-screen flex flex-col transition-colors duration-300">
        {/* 独立背景运行时（多图/视频/毛玻璃）。beforeInteractive 使其在构建期内联进
            导出 HTML 的 <head>，最早加载。资源随主题 dist 挂在站点根，与 /_next 同规则用
            根绝对路径引用；SPA 深链刷新下仍能命中（详见后端 web/public/public.go 的根服务逻辑）。 */}
        <Script src="/komari-appearance.js" strategy="beforeInteractive" />
        <Providers>
          <NavBar />
          <main className="flex-1 py-4 md:py-12">
            {children}
          </main>
          <Footer />
          <RemainingValueCalculator />
        </Providers>
      </body>
    </html>
  );
}
