import type { Pattern } from "../../schema.js";

export const i18n: Pattern = {
  name: "Internationalization",
  slug: "i18n",
  description:
    "Type-safe internationalization with next-intl. Includes locale detection, server components support, and message formatting.",
  category: "developer-experience",
  frameworks: ["nextjs"],
  tier: "free",
  complexity: "intermediate",
  tags: ["i18n", "internationalization", "localization", "next-intl"],
  files: {
    nextjs: [
      {
        path: "lib/i18n/config.ts",
        content: `// Supported locales. Add a locale here and ship a matching messages/<locale>.json.
export const locales = ["en", "es"] as const;
export type Locale = (typeof locales)[number];

// Default locale
export const defaultLocale: Locale = "en";

// Locale metadata
export const localeNames: Record<Locale, string> = {
  en: "English",
  es: "Español",
};

// Locale flags (emoji or image paths)
export const localeFlags: Record<Locale, string> = {
  en: "🇺🇸",
  es: "🇪🇸",
};

// Date/time formats per locale
export const dateFormats: Record<Locale, Intl.DateTimeFormatOptions> = {
  en: { dateStyle: "medium" },
  es: { dateStyle: "medium" },
};

// Number formats per locale
export const numberFormats: Record<Locale, Intl.NumberFormatOptions> = {
  en: { style: "decimal" },
  es: { style: "decimal" },
};

// Currency formats
export const currencyFormats: Record<Locale, { currency: string; locale: string }> = {
  en: { currency: "USD", locale: "en-US" },
  es: { currency: "EUR", locale: "es-ES" },
};
`,
      },
      {
        path: "lib/i18n/request.ts",
        content: `import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { locales, defaultLocale } from "./config";

export default getRequestConfig(async ({ requestLocale }) => {
  // Get the locale from the request and validate it without an unsafe cast.
  const requested = await requestLocale;
  const locale = hasLocale(locales, requested) ? requested : defaultLocale;

  return {
    locale,
    messages: (await import(\`@/messages/\${locale}.json\`)).default,
  };
});
`,
      },
      {
        path: "middleware.ts",
        content: `import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "@/lib/i18n/config";

export default createMiddleware({
  // A list of all locales that are supported
  locales,

  // Used when no locale matches
  defaultLocale,

  // Don't prefix the default locale
  localePrefix: "as-needed",
});

export const config = {
  // Match all pathnames except for
  // - API routes
  // - _next/static (static files)
  // - _next/image (image optimization files)
  // - favicon.ico, robots.txt, sitemap.xml
  matcher: ["/((?!api|_next|_vercel|.*\\\\..*).*)"],
};
`,
      },
      {
        path: "messages/en.json",
        content: `{
  "common": {
    "loading": "Loading...",
    "error": "Something went wrong",
    "retry": "Try again",
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "create": "Create",
    "search": "Search",
    "noResults": "No results found"
  },
  "auth": {
    "signIn": "Sign in",
    "signOut": "Sign out",
    "signUp": "Sign up",
    "email": "Email",
    "password": "Password",
    "forgotPassword": "Forgot password?",
    "resetPassword": "Reset password",
    "confirmPassword": "Confirm password"
  },
  "navigation": {
    "home": "Home",
    "dashboard": "Dashboard",
    "settings": "Settings",
    "profile": "Profile",
    "help": "Help"
  },
  "greeting": {
    "hello": "Hello, {name}!",
    "welcome": "Welcome back, {name}",
    "goodMorning": "Good morning",
    "goodAfternoon": "Good afternoon",
    "goodEvening": "Good evening"
  },
  "errors": {
    "required": "{field} is required",
    "invalid": "Invalid {field}",
    "minLength": "{field} must be at least {min} characters",
    "maxLength": "{field} must be at most {max} characters",
    "notFound": "Page not found",
    "unauthorized": "You are not authorized to view this page",
    "serverError": "A server error occurred"
  },
  "meta": {
    "title": "My App",
    "description": "An awesome application"
  }
}
`,
      },
      {
        path: "messages/es.json",
        content: `{
  "common": {
    "loading": "Cargando...",
    "error": "Algo salió mal",
    "retry": "Intentar de nuevo",
    "save": "Guardar",
    "cancel": "Cancelar",
    "delete": "Eliminar",
    "edit": "Editar",
    "create": "Crear",
    "search": "Buscar",
    "noResults": "No se encontraron resultados"
  },
  "auth": {
    "signIn": "Iniciar sesión",
    "signOut": "Cerrar sesión",
    "signUp": "Registrarse",
    "email": "Correo electrónico",
    "password": "Contraseña",
    "forgotPassword": "¿Olvidaste tu contraseña?",
    "resetPassword": "Restablecer contraseña",
    "confirmPassword": "Confirmar contraseña"
  },
  "navigation": {
    "home": "Inicio",
    "dashboard": "Panel",
    "settings": "Configuración",
    "profile": "Perfil",
    "help": "Ayuda"
  },
  "greeting": {
    "hello": "¡Hola, {name}!",
    "welcome": "Bienvenido de nuevo, {name}",
    "goodMorning": "Buenos días",
    "goodAfternoon": "Buenas tardes",
    "goodEvening": "Buenas noches"
  },
  "errors": {
    "required": "{field} es requerido",
    "invalid": "{field} inválido",
    "minLength": "{field} debe tener al menos {min} caracteres",
    "maxLength": "{field} debe tener como máximo {max} caracteres",
    "notFound": "Página no encontrada",
    "unauthorized": "No tienes autorización para ver esta página",
    "serverError": "Ocurrió un error en el servidor"
  },
  "meta": {
    "title": "Mi App",
    "description": "Una aplicación increíble"
  }
}
`,
      },
      {
        path: "components/locale-switcher.tsx",
        content: `"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { locales, localeNames, localeFlags, type Locale } from "@/lib/i18n/config";

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleChange = (newLocale: Locale) => {
    // Remove current locale prefix and add new one
    const segments = pathname.split("/");
    if (locales.includes(segments[1] as Locale)) {
      segments[1] = newLocale;
    } else {
      segments.splice(1, 0, newLocale);
    }
    router.push(segments.join("/"));
  };

  return (
    <div className="relative">
      <select
        value={locale}
        onChange={(e) => handleChange(e.target.value as Locale)}
        className="appearance-none bg-white border rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {locales.map((loc) => (
          <option key={loc} value={loc}>
            {localeFlags[loc]} {localeNames[loc]}
          </option>
        ))}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
        <svg
          className="w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </div>
    </div>
  );
}
`,
      },
      {
        path: "hooks/use-formatted.ts",
        content: `"use client";

import { useFormatter, useLocale } from "next-intl";
import { currencyFormats, type Locale } from "@/lib/i18n/config";

// Hook for common formatting utilities
export function useFormatted() {
  const format = useFormatter();
  const locale = useLocale() as Locale;

  return {
    // Format date
    date: (date: Date | number, options?: Intl.DateTimeFormatOptions) =>
      format.dateTime(date, options),

    // Format relative time (e.g., "2 hours ago")
    relative: (date: Date | number) => format.relativeTime(date),

    // Format number
    number: (value: number, options?: Intl.NumberFormatOptions) =>
      format.number(value, options),

    // Format currency with locale-appropriate currency
    currency: (value: number) => {
      const { currency, locale: currencyLocale } = currencyFormats[locale];
      return new Intl.NumberFormat(currencyLocale, {
        style: "currency",
        currency,
      }).format(value);
    },

    // Format percentage
    percent: (value: number) =>
      format.number(value, { style: "percent", maximumFractionDigits: 1 }),

    // Format list (e.g., "a, b, and c")
    list: (items: string[], type: "conjunction" | "disjunction" = "conjunction") =>
      format.list(items, { type }),
  };
}
`,
      },
      {
        path: "app/[locale]/layout.tsx.example",
        content: `// Example: Locale-specific layout

import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales } from "@/lib/i18n/config";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // In Next.js 15+ params is a Promise and must be awaited.
  const { locale } = await params;

  // Validate the locale without an unsafe cast.
  if (!hasLocale(locales, locale)) {
    notFound();
  }

  // Enable static rendering for locale-aware server components.
  setRequestLocale(locale);

  // Load messages for the locale
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
`,
      },
      {
        path: "next.config.ts.example",
        content: `// Add to your next.config.ts
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./lib/i18n/request.ts");

const config = {
  // Your existing Next.js config
};

export default withNextIntl(config);
`,
      },
    ],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
  dependencies: {
    nextjs: [{ name: "next-intl", version: "^4.0.0" }],
    remix: [],
    sveltekit: [],
    nuxt: [],
    universal: [],
  },
};
