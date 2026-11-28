import type { Metadata } from "next";
import { Raleway, Inter, Hind_Siliguri } from "next/font/google";
import "../globals.css";
import { cn } from "@/lib/utils";
import { getMessages } from "next-intl/server";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { LocaleSwitcher } from "@/components/shared/locale-switcher";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
  display: "swap",
});

const raleway = Raleway({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-raleway",
  display: "swap",
});

const hindSiliguri = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-bangla",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ordexa",
  description: "",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const messages = await getMessages();
  const bodyFont = locale === "bn" ? "font-bangla" : "font-inter";

  return (
    <html
      lang={locale}
      className={cn(
        "h-full antialiased",
        raleway.variable,
        inter.variable,
        hindSiliguri.variable,
        bodyFont
      )}
    >
      <body className="min-h-full">
        <NextIntlClientProvider messages={messages}>
          {children}
          <LocaleSwitcher />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
