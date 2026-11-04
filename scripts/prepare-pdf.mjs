import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
const version = '5.4.394'
const directory = new URL('../public/pdfjs/', import.meta.url)
await mkdir(directory, { recursive: true })
for (const [source, target] of [['legacy/build/pdf.min.mjs', 'pdf.min.mjs'], ['legacy/build/pdf.worker.min.mjs', 'pdf.worker.min.mjs'], ['LICENSE', 'LICENSE']]) {
  const output = new URL(target, directory)
  const marker = new URL(target + '.version', directory)
  try { if ((await readFile(marker, 'utf8')) === version && (await readFile(output)).length > 100) continue } catch { /* download missing assets */ }
  const response = await fetch(`https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/${source}`, { signal: AbortSignal.timeout(60000) })
  if (!response.ok) throw new Error(`PDF.js download failed: ${response.status} ${source}`)
  const content = await response.text()
  if (content.length < 100) throw new Error('Incomplete PDF.js asset')
  await writeFile(output, content)
  await writeFile(marker, version)
  console.log(`Prepared ${fileURLToPath(output)}`)
}
