import { parseScene } from '@/lib/doc';
import { currentUserId } from '@/lib/server/auth';
import { readText } from '@/lib/server/body';
import { prisma } from '@/lib/server/db';
import { allow } from '@/lib/server/ratelimit';

/*
 * Scenes shared for review (server edition): a signed-in user shares a copy of a scene; anyone
 * with its link sees it and says what they think at moments of it ([id]/comments).
 */

const MAX_BYTES = 2 * 1024 * 1024;
/** How many scenes one person shares an hour (each a copy kept on the server). */
const PER_HOUR = 30;

export async function POST(req: Request) {
  const userId = await currentUserId();
  if (!userId) return Response.json({ error: 'Sign in to share a scene for review' }, { status: 401 });
  const text = await readText(req, MAX_BYTES);
  if (text === null) return Response.json({ error: 'The scene is too large to share' }, { status: 413 });
  if (!allow(`review:${userId}`, PER_HOUR, 3_600_000)) return Response.json({ error: 'That is a lot of scenes shared at once: wait a while' }, { status: 429 });
  let scene;
  try {
    // Validated and normalised like any scene file.
    scene = parseScene(JSON.parse(text).scene);
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 400 });
  }
  const row = await prisma.review.create({ data: { userId, name: scene.name.slice(0, 120), scene: JSON.stringify(scene) } });
  return Response.json({ id: row.id });
}
