"use client"

/**
 * Storage wrappers that never throw.
 *
 * Inside the Kunfupay iframe the document can have an opaque origin ("null"),
 * and browsers answer any Web Storage access there with a SecurityError. An
 * unguarded getItem is enough to blank the whole app, so every read and write
 * goes through here: storage is a cache, never a hard dependency.
 */

type Kind = "session" | "local"

function store(kind: Kind): Storage | null {
  try {
    return kind === "session" ? window.sessionStorage : window.localStorage
  } catch {
    return null
  }
}

function get(kind: Kind, key: string): string | null {
  try {
    return store(kind)?.getItem(key) ?? null
  } catch {
    return null
  }
}

function set(kind: Kind, key: string, value: string): void {
  try {
    store(kind)?.setItem(key, value)
  } catch {
    // Storage denied or full — callers keep the value in React state.
  }
}

function remove(kind: Kind, key: string): void {
  try {
    store(kind)?.removeItem(key)
  } catch {
    // Nothing to do: the value was never persisted.
  }
}

export const safeSession = {
  getItem: (key: string) => get("session", key),
  setItem: (key: string, value: string) => set("session", key, value),
  removeItem: (key: string) => remove("session", key),
}

export const safeLocal = {
  getItem: (key: string) => get("local", key),
  setItem: (key: string, value: string) => set("local", key, value),
  removeItem: (key: string) => remove("local", key),
}
