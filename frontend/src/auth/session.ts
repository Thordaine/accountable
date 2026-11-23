import { createClient } from "@supabase/supabase-js";
import type { Config } from "./config";

/** A sign-in, local or Supabase, behind one shape. */
export interface Session {
  local: boolean;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  token(): Promise<string | null>;
  onChange(listener: () => void): () => void;
}

/** The email or password was wrong. */
export class WrongCredentials extends Error {}

export const TOKEN_KEY = "accountable.token";

/** The test sign-in of a local run; the token is kept in localStorage. */
export function localSession(): Session {
  const listeners = new Set<() => void>();
  const changed = () => listeners.forEach((listener) => listener());
  return {
    local: true,
    async signIn(email, password) {
      const response = await fetch("/api/local-sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (response.status === 401) throw new WrongCredentials();
      if (!response.ok) throw new Error(`Sign-in failed (${response.status})`);
      localStorage.setItem(TOKEN_KEY, (await response.json()).token);
      changed();
    },
    async signOut() {
      localStorage.removeItem(TOKEN_KEY);
      changed();
    },
    async token() {
      return localStorage.getItem(TOKEN_KEY);
    },
    onChange(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/** Supabase Auth; supabase-js keeps and refreshes the session. */
export function supabaseSession(url: string, key: string): Session {
  const { auth } = createClient(url, key);
  return {
    local: false,
    async signIn(email, password) {
      const { error } = await auth.signInWithPassword({ email, password });
      if (error?.code === "invalid_credentials") throw new WrongCredentials();
      if (error) throw error;
    },
    async signOut() {
      await auth.signOut();
    },
    async token() {
      const { data } = await auth.getSession();
      return data.session?.access_token ?? null;
    },
    onChange(listener) {
      const { data } = auth.onAuthStateChange((event) => {
        if (event === "SIGNED_IN" || event === "SIGNED_OUT") listener();
      });
      return () => data.subscription.unsubscribe();
    },
  };
}

/** The session the server's config asks for. */
export function sessionFor(config: Config): Session {
  return config.mode === "local"
    ? localSession()
    : supabaseSession(config.supabase_url, config.supabase_publishable_key);
}
