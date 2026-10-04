import { renderPortfolio } from '../scripts/portfolioHtml'
import { workCollections } from '../src/content/cms'
import { works, type CmsContext } from '../server/store'

export async function onRequest(context: CmsContext) {
  const assetHeaders = new Headers(context.request.headers)
  if (context.env.CMS_DB) { assetHeaders.delete('If-None-Match'); assetHeaders.delete('If-Modified-Since') }
  const response = await context.next(new Request(context.request, { headers: assetHeaders }))
  if (context.request.method !== 'GET' || !context.env.CMS_DB || !response.ok || !response.headers.get('Content-Type')?.includes('text/html')) return response
  try {
    const content = renderPortfolio(workCollections(await works(context.env)))
    const html = await response.clone().text()
    const headers = new Headers(response.headers)
    headers.delete('Content-Length'); headers.delete('ETag'); headers.delete('Last-Modified'); headers.set('Cache-Control', 'no-cache')
    return new Response(html.replace(/<!-- readable:start -->[\s\S]*?<!-- readable:end -->/, content), { status: response.status, headers })
  } catch { return response }
}

