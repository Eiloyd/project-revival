import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { fillServerEnvAliases } from "./lib/server-env";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    // A disconnected client/explicit Stop is expected, not an HTML 500 page.
    if (typeof error === "object" && error !== null && "name" in error && error.name === "AbortError") {
      return new Response(null, { status: 499 });
    }
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Other hosts (e.g. the Vercel Supabase integration) name the backend keys differently; fill the names this app reads.
const envAliasMiddleware = createMiddleware().server(async ({ next }) => {
  if (typeof process !== "undefined" && process.env) fillServerEnvAliases(process.env as Record<string, string | undefined>);
  return next();
});

// Start installs this automatically when src/start.ts is absent; defining the
// file opts out, so re-add it explicitly to keep server functions protected
// from cross-site requests.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [envAliasMiddleware, errorMiddleware, csrfMiddleware],
}));
