import { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import createNextIntlPlugin from "next-intl/plugin"

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts")

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack infers the workspace root from the outermost lockfile it can
  // find, and a stray package-lock.json in the user's home directory makes it
  // pick $HOME. The `@/…` aliases then resolve against the wrong base and
  // every import fails with "file not found". Pinning the root removes the
  // guesswork.
  turbopack: {
    root: dirname(fileURLToPath(import.meta.url)),
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default withNextIntl(nextConfig)
