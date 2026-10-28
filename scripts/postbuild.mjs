// Copy static assets next to the standalone server (portable replacement for `cp -r`).
import { cpSync, existsSync } from 'node:fs'

if (!existsSync('.next/standalone')) {
  console.error('postbuild: .next/standalone not found — did `next build` succeed?')
  process.exit(1)
}
cpSync('.next/static', '.next/standalone/.next/static', { recursive: true })
cpSync('public', '.next/standalone/public', { recursive: true })
console.log('postbuild: copied .next/static and public into .next/standalone')
