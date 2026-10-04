import { pbkdf2Sync, randomBytes } from 'node:crypto'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { createInterface } from 'node:readline/promises'
const automatic = process.argv.includes('--local-random')
const existing = existsSync('.dev.vars') ? readFileSync('.dev.vars', 'utf8') : ''
if (automatic && /^ADMIN_PASSWORD_HASH=/m.test(existing)) { console.log('Existing studio credentials preserved.'); process.exit(0) }
const prompt = automatic ? null : createInterface({ input: process.stdin, output: process.stdout })
const password = automatic ? randomBytes(24).toString('base64url') : await prompt.question('Choose a studio password (16+ characters; terminal input is visible): ')
prompt?.close()
if (password.length < 16 || password.length > 256) throw new Error('Use 16–256 characters.')
const salt = randomBytes(16)
const value = `pbkdf2:100000:${salt.toString('hex')}:${pbkdf2Sync(password, salt, 100000, 32, 'sha256').toString('hex')}`
writeFileSync('.dev.vars', `${existing.replace(/^ADMIN_PASSWORD_HASH=.*\r?\n?/gm, '').trim()}\nADMIN_PASSWORD_HASH="${value}"\n`)
if (automatic) { writeFileSync('.local-cms-password.txt', `LOCAL PREVIEW ONLY\nStudio: http://127.0.0.1:8788/admin/\nPassword: ${password}\n\nSet your production password with npm run cms:password. Do not upload this file.\n`); console.log('Local password saved in ignored .local-cms-password.txt; not printed.') } else console.log('Hash saved in .dev.vars. Set ADMIN_PASSWORD_HASH as a Cloudflare Pages secret for production.')
