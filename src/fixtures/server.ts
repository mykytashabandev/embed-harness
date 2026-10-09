import path from 'node:path';
import fs from 'node:fs';

export const startFixtureServer = async (
  name: string,
): Promise<{ url: string; stop(): Promise<void> }> => {
  const root = path.resolve(import.meta.dir, '../../fixtures', name);

  if (!fs.existsSync(root)) {
    throw new Error(`No fixture named "${name}"`);
  }

  const server = Bun.serve({
    port: 4100,
    async fetch(req) {
      const { pathname } = new URL(req.url);
      const rel = pathname === '/' ? 'index.html' : pathname;

      const full = path.join(root, rel);

      if (!full.startsWith(root + path.sep)) {
        return new Response('Not found', { status: 404 });
      }

      const file = Bun.file(full);
      const fileExists = await file.exists();

      if (fileExists) {
        return new Response(file);
      }

      return new Response('Not found', { status: 404 });
    },
  });

  return {
    url: server.url.href,
    stop: () => server.stop(),
  };
};
