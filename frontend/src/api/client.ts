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

/** Call the JSON API; returns undefined for 204. */
export async function api<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    method,
    headers:
      body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    const { detail } = await response.json();
    throw new ApiError(response.status, detail);
  }
  return response.status === 204 ? (undefined as T) : response.json();
}
