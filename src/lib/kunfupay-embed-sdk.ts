"use client";

type TokenCallback = (token: string, expiresAt: number) => void;
type LocaleCallback = (locale: string) => void;
type ThemeCallback = (theme: string) => void;

class KunfupayEmbed {
  private tokenCallbacks: TokenCallback[] = [];
  private localeCallbacks: LocaleCallback[] = [];
  private themeCallbacks: ThemeCallback[] = [];
  private parentOrigin = "*";
  // Buffer the last locale received via postMessage so callbacks registered
  // after the host already sent `kunfupay:locale` still get it. The host
  // sends this right after the iframe loads, which often beats React hydration.
  private lastLocale: string | null = null;
  // Same buffering for the theme: the host sends `kunfupay:theme` as soon as
  // the frame loads, which usually beats our hydration.
  private lastTheme: string | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("message", this.handleMessage.bind(this));
    }
  }

  ready() {
    this.postToParent("kunfupay:ready", {});
  }

  resize(height: number) {
    this.postToParent("kunfupay:resize", { height });
  }

  autoResize() {
    if (typeof document !== "undefined") {
      this.resize(document.documentElement.scrollHeight);
    }
  }

  navigate(path: string) {
    if (!path.startsWith("/") || /^\/\//.test(path) || /^[a-zA-Z]+:/.test(path)) {
      console.warn("kunfupay:navigate only accepts relative paths (e.g. /home/sales)");
      return;
    }
    this.postToParent("kunfupay:navigate", { path });
  }

  close() {
    this.postToParent("kunfupay:close", {});
  }

  getTokenFromUrl(): string | null {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("embed_token");
  }

  /**
   * Resolves the locale for the embedded app, checking (in order):
   *   1. `?lang=` query param (set by the Kunfupay host when embedding)
   *   2. `navigator.language`
   * Returns the raw string; the caller is responsible for validating it
   * against its list of supported locales.
   */
  getLocaleFromUrl(): string | null {
    if (typeof window === "undefined") return null;
    const fromQuery = new URLSearchParams(window.location.search).get("lang");
    if (fromQuery) return fromQuery;
    return navigator.language || null;
  }

  /**
   * Resolves the theme the HOST wants the embedded app to render in,
   * from `?theme=` (set by the Kunfupay dashboard when embedding).
   * Returns the raw string ("light" | "dark" | "system" | anything);
   * the caller validates it.
   *
   * There is no way to read the host's theme directly — the parent document
   * is cross-origin — so an embedded app either gets told or guesses.
   */
  getThemeFromUrl(): string | null {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("theme");
  }

  onTokenReceived(cb: TokenCallback) {
    this.tokenCallbacks.push(cb);
  }

  /**
   * Subscribe to locale updates sent by the Kunfupay host via
   * postMessage `{ type: "kunfupay:locale", payload: { locale } }`.
   * Useful when the user changes language in the dashboard while the
   * iframe is already loaded.
   */
  onLocaleReceived(cb: LocaleCallback): () => void {
    this.localeCallbacks.push(cb);
    if (this.lastLocale) {
      cb(this.lastLocale);
    }
    return () => {
      this.localeCallbacks = this.localeCallbacks.filter((c) => c !== cb);
    };
  }

  /**
   * Subscribe to theme updates sent by the host via postMessage
   * `{ type: "kunfupay:theme", payload: { theme } }` — fires when the user
   * flips light/dark in the Kunfupay dashboard with the iframe already open.
   */
  onThemeReceived(cb: ThemeCallback): () => void {
    this.themeCallbacks.push(cb);
    if (this.lastTheme) {
      cb(this.lastTheme);
    }
    return () => {
      this.themeCallbacks = this.themeCallbacks.filter((c) => c !== cb);
    };
  }

  /** Whether the host has already sent a `kunfupay:theme` message. */
  hasReceivedTheme(): boolean {
    return this.lastTheme !== null;
  }

  /**
   * Whether the host has already sent a `kunfupay:locale` message. Use this
   * to gate fallbacks (like `navigator.language`) so they don't fight with
   * the authoritative host locale.
   */
  hasReceivedLocale(): boolean {
    return this.lastLocale !== null;
  }

  private handleMessage(event: MessageEvent) {
    const msg = event.data;
    if (!msg?.type?.startsWith("kunfupay:")) return;
    this.parentOrigin = event.origin;

    if (msg.type === "kunfupay:token" && msg.payload?.token) {
      this.tokenCallbacks.forEach((cb) =>
        cb(msg.payload.token, msg.payload.expiresAt)
      );
      return;
    }

    if (msg.type === "kunfupay:theme" && msg.payload?.theme) {
      this.lastTheme = msg.payload.theme;
      this.themeCallbacks.forEach((cb) => cb(msg.payload.theme));
      return;
    }

    if (msg.type === "kunfupay:locale" && msg.payload?.locale) {
      this.lastLocale = msg.payload.locale;
      this.localeCallbacks.forEach((cb) => cb(msg.payload.locale));
      return;
    }
  }

  private postToParent(type: string, payload: Record<string, unknown>) {
    if (typeof window !== "undefined") {
      window.parent?.postMessage({ type, payload }, this.parentOrigin);
    }
  }
}

export const kunfupayEmbed = new KunfupayEmbed();
