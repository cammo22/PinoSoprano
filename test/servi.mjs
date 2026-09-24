// Piccolo server statico per le prove (nessuna dipendenza): serve la cartella del sito.
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const RADICE = fileURLToPath(new URL('..', import.meta.url));
const TIPI = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.json': 'application/json' };

export function avviaServer(porta = 0) {
  const server = http.createServer(async (req, res) => {
    try {
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (p.endsWith('/')) p += 'index.html';
      const file = normalize(join(RADICE, p));
      if (!file.startsWith(normalize(RADICE))) { res.writeHead(403); return res.end(); }
      await stat(file);
      const dati = await readFile(file);
      res.writeHead(200, { 'Content-Type': TIPI[extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(dati);
    } catch (e) { res.writeHead(404); res.end('non trovato'); }
  });
  return new Promise(ok => server.listen(porta, '127.0.0.1', () => ok({ server, url: `http://127.0.0.1:${server.address().port}/` })));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { url } = await avviaServer(Number(process.env.PORT) || 8080);
  console.log('Sito su', url);
}
