import { dirname } from "node:path"
import { fileURLToPath } from "node:url"

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack infers the workspace root from the outermost lockfile it can
  // find, and a stray package-lock.json in the user's home directory makes it
  // pick $HOME. The `@/…` aliases then resolve against the wrong base and
  // every import fails with "file not found". Pinning the root removes the
  // guesswork — this repo also ships three lockfiles of its own, which feeds
  // the same inference.
  turbopack: {
    root: dirname(fileURLToPath(import.meta.url)),
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // schema.sql is read at runtime by lib/supabase-migrate.ts. Without this
  // entry, the serverless bundle for the Vercel function that imports
  // ensureSchema() will not include schema.sql, and the migration runner
  // will log "schema.sql not found" on every cold start.
  // Vercel bundles follow the application root by default; we extend
  // `outputFileTracingIncludes` so the file explicitly survives the trace.
  outputFileTracingIncludes: {
    "**/*": ["./schema.sql"],
  },
}

export default nextConfig
