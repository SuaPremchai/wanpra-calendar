import fs from 'node:fs/promises';
await fs.mkdir('feed-dist', { recursive: true });
await fs.writeFile('feed-dist/index.html', '<!doctype html><html lang="th"><meta charset="utf-8"><title>WanPra Feed</title><a href="https://suapremchai.github.io/wanpra-calendar/">เปิด WanPra</a></html>');
