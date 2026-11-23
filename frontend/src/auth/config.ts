/** Which sign-in this server uses, from `/api/config`. */
export type Config =
  | { mode: "local" }
  | {
      mode: "supabase";
      supabase_url: string;
      supabase_publishable_key: string;
    };

/** Ask the server which sign-in to use. */
export async function loadConfig(): Promise<Config> {
  const response = await fetch("/api/config");
  return response.json();
}
