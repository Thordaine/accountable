import { localSession, type Session } from "../auth/session";

let session: Session = localSession();

/** The session whose token every call sends. */
export function setSession(current: Session) {
  session = current;
}

/** An error response from the API, with field messages for a 422. */
export class ApiError extends Error {
  status: number;
  fields: Record<string, string>;

  constructor(status: number, detail: unknown) {
    super(typeof detail === "string" ? detail : `Request failed (${status})`);
    this.status = status;
    this.fields = Array.isArray(detail) ? fieldMessages(detail) : {};
  }
}

function fieldMessages(detail: { loc: (string | number)[]; msg: string }[]) {
  return Object.fromEntries(
    detail.map((d) => [
      String(d.loc.at(-1)),
      d.msg.replace(/^Value error, /, ""),
    ]),
  );
}

/** The browser's time zone, the session's token and the body's type. */
async function headers(body: unknown) {
  const token = await session.token();
  return {
    "X-Time-Zone": Intl.DateTimeFormat().resolvedOptions().timeZone,
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(body !== undefined && { "Content-Type": "application/json" }),
  };
}

/** Call the JSON API with the session's token; a 401 signs out. */
export async function api<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method,
    headers: await headers(body),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (response.status === 401) await session.signOut();
  if (!response.ok) {
    const { detail } = await response.json();
    throw new ApiError(response.status, detail);
  }
  return response.status === 204 ? (undefined as T) : response.json();
}
