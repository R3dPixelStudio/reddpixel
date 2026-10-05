import { cpSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { randomBytes, pbkdf2Sync } from 'node:crypto'

// Isolated local test credentials and storage. Never copies the owner's .dev.vars.
const root = resolve('.task-baseline/cms-fixture')
mkdirSync(root, { recursive: true })
for (const name of ['dist', 'functions', 'server', 'scripts', 'src', 'migrations']) cpSync(name, join(root, name), { recursive: true })
writeFileSync(join(root, 'package.json'), '{"private":true,"type":"module"}\n')
writeFileSync(join(root, 'wrangler.jsonc'), JSON.stringify({ name: 'reddpixel-local-check', compatibility_date: '2026-09-25', d1_databases: [{ binding: 'CMS_DB', database_name: 'reddpixel-local-check', database_id: 'isolated-local-check', migrations_dir: 'migrations' }] }, null, 2))
const password = randomBytes(24).toString('hex'), salt = randomBytes(16).toString('hex')
const hash = `pbkdf2:100000:${salt}:${pbkdf2Sync(password, Buffer.from(salt, 'hex'), 100000, 32, 'sha256').toString('hex')}`
writeFileSync(join(root, '.dev.vars'), `ADMIN_PASSWORD_HASH="${hash}"\n`)
writeFileSync(join(root, '.local-cms-password.txt'), `Password: ${password}\n`)
console.log(`Isolated D1-only fixture prepared at ${root}; test credentials remain ignored.`)
