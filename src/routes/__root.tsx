import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
  useRouterState,
} from "@tanstack/react-router";
import { type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { CountryLogosProvider } from "@/components/country-logo";
import { workspacePaths } from "@/lib/dashboards";
import { SiteTracker } from "@/components/site-tracker";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "google-site-verification", content: "H2ZVxeKFo_fBc56xeMXt4pGtJaQb4_ocDIAz5Oy_psc" },
      { title: "Riloyd — Business Funding, Strategy & Transformation" },
      { name: "description", content: "Riloyd helps startups and businesses grow with funding support, strategy, mentorship and transformation services." },
      { name: "author", content: "Riloyd" },
      { name: "theme-color", content: "#c8102e" },
      { property: "og:site_name", content: "Riloyd" },
      { property: "og:title", content: "Riloyd — Business Funding, Strategy & Transformation" },
      { property: "og:description", content: "Funding, strategy, mentorship and transformation for startups and growing businesses." },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "en_IN" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Riloyd",
          legalName: "RISHISHWAR INDUSTRY PRIVATE LIMITED",
          sameAs: ["https://www.linkedin.com/company/145354558", "https://www.instagram.com/riloyd.in/"],
        }),
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@400;500;600;700;800;900&display=swap" },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: false,
});

const themeBootScript = `(function(){try{var r=document.documentElement;var light=localStorage.getItem('riloyd-theme')==='light';r.classList.toggle('light',light);r.classList.remove('chhath','diwali');delete r.dataset.festiveDecor;r.style.colorScheme=light?'light':'dark';var d=localStorage.getItem('riloyd-dash-theme');if(d==='dark'||d==='comfort')r.dataset.dashTheme=d;}catch(e){}})();`;

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        {/* Apply the saved theme before first paint so the right pictures load and nothing flashes. */}
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  // Private workspaces bring their own menu and top bar, so the public header and footer are hidden there.
  const workspace = useRouterState({ select: state => workspacePaths.includes(state.location.pathname.replace(/\/$/, '')) });

  return (
    <QueryClientProvider client={queryClient}>
      <CountryLogosProvider>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      {!workspace && <SiteHeader />}
      <Outlet />
      <Toaster position="top-right" richColors closeButton />
      <SiteTracker />
      {!workspace && <SiteFooter />}
      </CountryLogosProvider>
    </QueryClientProvider>
  );
}
