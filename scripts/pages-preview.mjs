// Imitates GitHub Pages for a project site: static files under /<repo>/, unknown paths → 404.html (status 404).
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join } from 'node:path'
const root = 'dist'
const base = process.env.BASE_PATH ?? '/test-pg-mc/'
const port = Number(process.env.PORT ?? 4180)
const types = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
}
createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  if (!path.startsWith(base)) {
    res.writeHead(404)
    return res.end('Not found (outside site)')
  }
  let file = join(root, path.slice(base.length) || 'index.html')
  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html')
    const body = await readFile(file)
    res.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' })
    res.end(body)
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/html' })
    res.end(await readFile(join(root, '404.html')))
  }
}).listen(port, () => console.log(`GitHub Pages simulation on http://localhost:${port}${base}`))
