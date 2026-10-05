import { JOURNAL_POSTS } from '../src/content/journal'
import { baseWorks, type CmsPost, type CmsWork } from '../src/content/cms'

export interface Statement { bind(...values: unknown[]): Statement; all<T>(): Promise<{ results: T[] }>; first<T>(): Promise<T | null>; run(): Promise<{ meta: { changes?: number } }> }
export interface Database { prepare(sql: string): Statement }
export interface ObjectBody { body: ReadableStream<Uint8Array>; size: number; httpEtag: string; httpMetadata?: { contentType?: string }; range?: { offset: number; length: number } }
export interface Bucket { put(key: string, body: ReadableStream<Uint8Array>, options: { httpMetadata: { contentType: string } }): Promise<unknown>; get(key: string, options?: { range: { offset: number; length?: number } }): Promise<ObjectBody | null>; head(key: string): Promise<Omit<ObjectBody, 'body'> | null>; delete(key: string): Promise<void> }
export interface CmsEnv { CMS_DB?: Database; CMS_MEDIA?: Bucket; ADMIN_PASSWORD_HASH?: string; ALLOWED_ORIGIN?: string }
export interface CmsContext { request: Request; env: CmsEnv; next(request?: Request): Promise<Response>; waitUntil?(promise: Promise<unknown>): void }

export async function posts(env: CmsEnv, admin = false): Promise<CmsPost[]> {
  const merged = new Map<string, CmsPost>(JOURNAL_POSTS.map(p => [p.slug, { ...p, status: 'published', version: 0 }]))
  if (env.CMS_DB) {
    const { results } = await env.CMS_DB.prepare('SELECT payload FROM posts').all<{ payload: string }>()
    for (const row of results) { const p: CmsPost = JSON.parse(row.payload); merged.set(p.slug, p) }
  }
  return [...merged.values()].filter(p => admin || p.status === 'published')
}
export async function works(env: CmsEnv, admin = false): Promise<CmsWork[]> {
  const merged = new Map(baseWorks().map(w => [w.id, w]))
  if (env.CMS_DB) {
    const { results } = await env.CMS_DB.prepare('SELECT payload FROM works').all<{ payload: string }>()
    for (const row of results) { const w: CmsWork = JSON.parse(row.payload); merged.set(w.id, w) }
  }
  return [...merged.values()].filter(w => admin || w.status === 'published')
}

