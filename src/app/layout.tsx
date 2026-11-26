import type { Metadata, Viewport } from "next";
import { Almarai, Noto_Sans_Arabic } from "next/font/google";
import { PrefsProvider } from "@/components/PrefsProvider";
import { dirOf, translate } from "@/lib/i18n";
import { getPrefs } from "@/lib/prefs.server";
import "./globals.css";

const almarai = Almarai({
  variable: "--font-almarai",
  subsets: ["arabic"],
  weight: ["400", "700", "800"],
  display: "swap",
});

const notoArabic = Noto_Sans_Arabic({
  variable: "--font-noto-arabic",
  subsets: ["arabic"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await getPrefs();
  return { title: translate(locale, "brand") };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const { locale, theme } = await getPrefs();
  return (
    <html
      lang={locale}
      dir={dirOf(locale)}
      data-theme={theme}
      className={`${almarai.variable} ${notoArabic.variable}`}
    >
      <body className="min-h-dvh">
        <PrefsProvider initialLocale={locale} initialTheme={theme}>
          {children}
        </PrefsProvider>
      </body>
    </html>
  );
}
