CREATE TABLE IF NOT EXISTS posts (slug TEXT PRIMARY KEY, payload TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('draft','published')), version INTEGER NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS works (id TEXT PRIMARY KEY, payload TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('draft','published')), version INTEGER NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS comments (id TEXT PRIMARY KEY, slug TEXT NOT NULL, name TEXT NOT NULL, text TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','hidden')), reply TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS comments_post ON comments(slug,status,created_at);
CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, csrf TEXT NOT NULL, expires INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires);
CREATE TABLE IF NOT EXISTS throttle (key TEXT PRIMARY KEY, count INTEGER NOT NULL, reset INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS throttle_expiry ON throttle(reset);
CREATE TABLE IF NOT EXISTS media (key TEXT PRIMARY KEY, src TEXT NOT NULL, type TEXT NOT NULL, name TEXT NOT NULL, bytes INTEGER NOT NULL, created_at TEXT NOT NULL);
