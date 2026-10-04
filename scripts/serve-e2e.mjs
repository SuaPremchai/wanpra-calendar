import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import calendarFeed from '../api/calendar.js';

const root = path.resolve('dist');
const prefix = '/wanpra-calendar/';
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ics': 'text/calendar' };
http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname === '/calendar.ics') { calendarFeed(req, res); return; }
    if (pathname === prefix + 'src/config.js') {
      res.writeHead(200, { 'Content-Type': 'text/javascript', 'Cache-Control': 'no-store' });
      res.end("export const CUSTOM_FEED_ENDPOINT = 'http://127.0.0.1:4173/calendar.ics';");
      return;
    }
    if (!pathname.startsWith(prefix)) throw new Error('Outside project path');
    const file = path.resolve(root, pathname.slice(prefix.length) || 'index.html');
    if (!file.startsWith(root + path.sep)) throw new Error('Outside dist');
    const body = await fs.readFile(file);
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
}).listen(4173, '127.0.0.1');
