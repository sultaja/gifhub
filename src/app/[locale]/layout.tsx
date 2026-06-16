import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'
import Script from 'next/script'
import { ThemeProvider } from '@/components/theme-provider'
import { ThemeScript } from '@/components/theme-script'
import { ScrollToTop } from '@/components/scroll-to-top'
import { ScrollProgress } from '@/components/scroll-progress'

import { KeyboardShortcuts } from '@/components/keyboard-shortcuts'
import { MobileNav } from '@/components/mobile-nav'
import { ToastProvider } from '@/components/ui/toast'
import { getSettings } from '@/lib/settings'
import '../globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings()

  return {
    title: {
      default: settings.seo_title || 'GifHub.App — Professional GIFs for the Workplace',
      template: `%s | ${settings.site_name || 'GifHub.App'}`,
    },
    description: settings.seo_description || 'Discover, share, and download the perfect reaction GIF for every workplace moment.',
    ...(settings.search_console_verification ? {
      verification: {
        google: settings.search_console_verification,
      },
    } : {}),
  }
}

export function generateStaticParams() {
  return [{ locale: 'en' }]
}

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const messages = await getMessages()

  const settings = await getSettings()
  const adsenseId = settings.adsense_client_id
  const gtmId = settings.gtm_id
  const gaId = settings.ga_measurement_id

  const themeStyle = `
    :root {
      --color-primary: ${settings.primary_color};
      --color-accent: ${settings.accent_color};
    }
    .dark {
      --color-primary: ${settings.primary_color_dark};
      --color-accent: ${settings.accent_color_dark};
    }
  `

  return (
    <html lang={locale} className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <head suppressHydrationWarning>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#7c3aed" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <style dangerouslySetInnerHTML={{ __html: themeStyle }} />

        {/* Google Tag Manager */}
        {gtmId && (
          <Script id="gtm-head" strategy="afterInteractive">{`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${gtmId}');
          `}</Script>
        )}

        {/* Google Analytics 4 (standalone, if no GTM) */}
        {gaId && !gtmId && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
            <Script id="ga4-init" strategy="afterInteractive">{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}');
            `}</Script>
          </>
        )}

        {/* AdSense */}
        {adsenseId && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}

      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeScript />
        {/* Custom Head Scripts (moved here to prevent hydration errors in head) */}
        {settings.custom_head_scripts && (
          <div dangerouslySetInnerHTML={{ __html: settings.custom_head_scripts }} hidden />
        )}
        
        {/* GTM noscript fallback */}
        {gtmId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        )}

        <ThemeProvider>
          <NextIntlClientProvider messages={messages}>
            <ToastProvider>
              <ScrollProgress />
              <div id="main-content">
                {children}
              </div>
              <MobileNav />
              <ScrollToTop />
              <KeyboardShortcuts />
            </ToastProvider>
          </NextIntlClientProvider>
        </ThemeProvider>

        {/* Custom Body Scripts */}
        {settings.custom_body_scripts && (
          <div dangerouslySetInnerHTML={{ __html: settings.custom_body_scripts }} />
        )}
      </body>
    </html>
  )
}
