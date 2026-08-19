// Root layout is intentionally minimal. The real <html>/<body> shell lives in
// src/app/[locale]/layout.tsx so that it receives the resolved locale.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children
}
