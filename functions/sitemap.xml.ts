import { renderSitemap } from '../scripts/journalHtml'
import { posts, type CmsContext } from '../server/store'
export async function onRequest({ request, env }: CmsContext) {
  if (!['GET', 'HEAD'].includes(request.method)) return new Response(null, { status: 405 })
  try { return new Response(request.method === 'HEAD' ? null : renderSitemap(await posts(env)), { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'no-cache' } }) } catch { return new Response('Sitemap unavailable.', { status: 503 }) }
}
