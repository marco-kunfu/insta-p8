import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["es", "en", "fr", "pt"],
  defaultLocale: "es",
  // 'as-needed' keeps default-locale URLs clean: /embed stays /embed,
  // and /en/embed, /fr/embed, /pt/embed are the localized variants.
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
