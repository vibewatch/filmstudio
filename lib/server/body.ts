import 'server-only';

/*
 * A request's body, read no further than it may be: refused by the size it says it is before it is
 * read, and by what comes once that is more (a body sent in chunks says no size). Every route that
 * takes one reads it so: anyone can sign in, so a size checked after reading keeps nothing out.
 */

/** The body's bytes, or null when it is more than `max` bytes. */
export async function readBody(req: Request, max: number): Promise<Uint8Array | null> {
  if (Number(req.headers.get('content-length') ?? 0) > max) return null;
  if (!req.body) return new Uint8Array();
  const reader = req.body.getReader();
  const parts: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > max) {
      await reader.cancel();
      return null;
    }
    parts.push(value);
  }
  const out = new Uint8Array(size);
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}

/** The body as text (UTF-8), or null when it is more than `max` bytes. */
export async function readText(req: Request, max: number): Promise<string | null> {
  const bytes = await readBody(req, max);
  return bytes && new TextDecoder().decode(bytes);
}
