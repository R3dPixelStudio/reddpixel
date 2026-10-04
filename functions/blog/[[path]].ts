import { renderJournalIndex, renderJournalPost } from '../../scripts/journalHtml'
import { posts, type CmsContext } from '../../server/store'
import type { CmsComment } from '../../src/content/cms'

export async function onRequest(context: CmsContext) {
  if (!['GET', 'HEAD'].includes(context.request.method)) return new Response(null, { status: 405 })
  const slug = new URL(context.request.url).pathname.replace(/^\/blog\/?/, '').replace(/\/$/, '')
  try {
    const entries = await posts(context.env)
    const post = entries.find(p => p.slug === slug)
    if (slug && !post) return new Response('Field note not found.', { status: 404, headers: { 'Content-Type': 'text/plain', 'X-Robots-Tag': 'noindex' } })
    const comments = post && context.env.CMS_DB ? (await context.env.CMS_DB.prepare("SELECT id,slug,name,text,status,reply,created_at AS createdAt FROM comments WHERE slug = ? AND status = 'approved' ORDER BY created_at ASC LIMIT 200").bind(post.slug).all<CmsComment>()).results : []
    return new Response(context.request.method === 'HEAD' ? null : post ? renderJournalPost(post, comments, !!context.env.CMS_DB && !!context.env.ADMIN_PASSWORD_HASH) : renderJournalIndex(entries), { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; media-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'" } })
  } catch { return new Response('The journal is temporarily unavailable. Please try again shortly.', { status: 503, headers: { 'Content-Type': 'text/plain', 'Retry-After': '60' } }) }
}
