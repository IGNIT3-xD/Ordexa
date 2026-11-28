"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

const LOCALE_LABELS: Record<string, string> = {
  en: "EN",
  bn: "বাংলা",
};

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div
      role="group"
      aria-label="Language"
      className="fixed top-4 right-4 z-50 flex items-center gap-1 rounded-full border border-border bg-background/80 p-1 shadow-sm backdrop-blur"
    >
      {routing.locales.map((candidate) => {
        const isActive = candidate === locale;

        return (
          <button
            key={candidate}
            type="button"
            lang={candidate}
            onClick={() => router.replace(pathname, { locale: candidate })}
            aria-current={isActive ? "true" : undefined}
            className={cn(
              "rounded-full px-3 py-1 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {LOCALE_LABELS[candidate] ?? candidate}
          </button>
        );
      })}
    </div>
  );
}
