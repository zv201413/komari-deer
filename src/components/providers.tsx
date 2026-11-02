"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { ThemeProvider } from "@/contexts/ThemeContext"
import { RPC2Provider } from "@/contexts/RPC2Context"
import { PublicInfoProvider } from "@/contexts/PublicInfoContext"
import { NodeListProvider } from "@/contexts/NodeListContext"
import { LiveDataProvider } from "@/contexts/LiveDataContext"
import { Toaster } from "@/components/ui/sonner"
import { OfflineIndicator } from "@/components/OfflineIndicator"
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt"
import { PWAUpdatePrompt } from "@/components/PWAUpdatePrompt"
import EarthGlobeLauncher from "@/components/EarthGlobeLauncher"
import NetworkCapsuleBar from "@/components/NetworkCapsuleBar"
import i18n, { detectClientLanguage } from "@/i18n/config"
import { installDefaultEnterAction } from "@/utils/defaultEnter"

function I18nClientLanguageSync() {
  React.useEffect(() => {
    const detectedLanguage = detectClientLanguage();
    if (i18n.language !== detectedLanguage) {
      void i18n.changeLanguage(detectedLanguage);
    }
  }, []);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  React.useEffect(() => installDefaultEnterAction(document), []);
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <I18nClientLanguageSync />
      <ThemeProvider>
        <RPC2Provider>
          <PublicInfoProvider>
            <NodeListProvider>
              <LiveDataProvider>
                {children}
                <Toaster />
                <OfflineIndicator />
                <PWAInstallPrompt />
                <PWAUpdatePrompt />
                <NetworkCapsuleBar />
                <EarthGlobeLauncher />
              </LiveDataProvider>
            </NodeListProvider>
          </PublicInfoProvider>
        </RPC2Provider>
      </ThemeProvider>
    </NextThemesProvider>
  )
}
