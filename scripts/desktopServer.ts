import path from 'path';

const distDir = path.resolve(import.meta.dir, '../dist');
const port = 5173;

Bun.serve({
  hostname: '0.0.0.0',
  port,
  fetch(req) {
    const url = new URL(req.url);
    const relPath = url.pathname === '/' ? 'index.html' : url.pathname.replace(/^\//, '');
    const filePath = path.join(distDir, relPath);
    const file = Bun.file(filePath);
    if (file.size > 0) return new Response(file);
    return new Response(Bun.file(path.join(distDir, 'index.html')));
  },
});

console.log(`Dobot Studio Desktop Production Server running on http://127.0.0.1:${port}`);
