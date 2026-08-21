import type React from "react"
import type { Metadata } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { NextIntlClientProvider, hasLocale } from "next-intl"
import { setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"
import "../globals.css"
import { Toaster } from "@/components/ui/sonner"
import { BRAND, THEME_STORAGE_KEY } from "@/lib/brand"
import { ThemeProvider } from "@/components/theme-provider"
import { routing } from "@/i18n/routing"

// Plus Jakarta Sans throughout, measured on business.kunfupay.com: 200 of 201
// leaf elements. kunfupay.com, the marketing site, pairs Inter with it — but
// this is a dashboard product, and inside the dashboard there is one face and
// no monospace at all.
const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
})

export const metadata: Metadata = {
  title: `${BRAND.name} — ${BRAND.tagline}`,
  description: BRAND.description,
  // SVG only: the previous PNG set is the upstream fork's mark. Drop in
  // Kunfupay's own raster exports (32px, apple-touch) when they exist.
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

// Pre-hydration theme resolution. It must agree with ThemeProvider AND with
// HostThemeSync: under /embed the theme is the host's (?theme=, else the OS
// preference), everywhere else it is the stored preference. Getting this wrong
// shows as a flash of the wrong theme inside the Kunfupay dashboard.
const themeBootstrap = `
(function() {
  try {
    // Path segments, not a regex: this string is a template literal, so any
    // backslash escape here collapses before the browser ever parses it.
    var isEmbed = window.location.pathname.split('/').indexOf('embed') !== -1;
    var theme;
    if (isEmbed) {
      var hosted = new URLSearchParams(window.location.search).get('theme');
      theme = (hosted === 'light' || hosted === 'dark') ? hosted : 'system';
    } else {
      var stored = window.localStorage.getItem('${THEME_STORAGE_KEY}');
      theme = (stored === 'light' || stored === 'dark' || stored === 'system') ? stored : 'light';
    }
    var resolved = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;
    var root = document.documentElement;
    root.classList.toggle('dark', resolved === 'dark');
    root.style.colorScheme = resolved;
    root.dataset.theme = resolved;
  } catch (_) { /* noop */ }
})();
`.trim()

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ locale: string }>
}>) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }
  setRequestLocale(locale)

  return (
    <html lang={locale} className={plusJakarta.variable} suppressHydrationWarning>
      <head>
        {/* Pre-hydration theme bootstrap — prevents flash of wrong theme */}
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body className={`font-sans antialiased bg-background text-foreground`} suppressHydrationWarning>
        <NextIntlClientProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </NextIntlClientProvider>
        <Analytics />
        <Toaster />
      </body>
    </html>
  )
}
