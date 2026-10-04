import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'


import { renderHead, renderPortfolio } from './scripts/portfolioHtml'
import { renderJournalIndex, renderJournalPost, renderSitemap, renderStudio } from './scripts/journalHtml'
import { JOURNAL_POSTS, journalPath } from './src/content/journal'

// https://vite.dev/config/
export default defineConfig({
  build: { rolldownOptions: { input: { index: fileURLToPath(new URL('./index.html', import.meta.url)), journal: fileURLToPath(new URL('./src/journal/main.tsx', import.meta.url)), admin: fileURLToPath(new URL('./src/admin/main.tsx', import.meta.url)) }, output: { entryFileNames: chunk => ['journal', 'admin'].includes(chunk.name) ? `assets/${chunk.name}.js` : 'assets/[name]-[hash].js' } } },
  plugins: [
    react(), tailwindcss(),
    {
      name: 'portfolio-html',
      configureServer(server) {
        server.middlewares.use((request, response, next) => {
          const path = new URL(request.url ?? '/', 'http://localhost').pathname.replace(/\/index\.html$/, '/').replace(/\/$/, '')
          if (path === '/assets/journal.js' || path === '/assets/admin.js') { response.statusCode = 302; response.setHeader('Location', path.includes('journal') ? '/src/journal/main.tsx' : '/src/admin/main.tsx'); response.end(); return }
          const post = JOURNAL_POSTS.find((entry) => journalPath(entry).replace(/\/$/, '') === path)
          if (path !== '/blog' && !post && path !== '/sitemap.xml' && path !== '/admin') return next()
          response.setHeader('Content-Type', path === '/sitemap.xml' ? 'application/xml; charset=utf-8' : 'text/html; charset=utf-8')
          response.end(path === '/sitemap.xml' ? renderSitemap() : path === '/admin' ? renderStudio() : post ? renderJournalPost(post) : renderJournalIndex())
        })
      },
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'blog/index.html', source: renderJournalIndex() })
        for (const post of JOURNAL_POSTS) this.emitFile({ type: 'asset', fileName: `${journalPath(post).slice(1)}index.html`, source: renderJournalPost(post) })
        this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: renderSitemap() })
        this.emitFile({ type: 'asset', fileName: 'admin/index.html', source: renderStudio() })
      },
      transformIndexHtml: {
        order: 'pre',
        handler: (html) => html.replace('<!-- portfolio-head -->', renderHead()).replace('<!-- portfolio-content -->', `<!-- readable:start -->${renderPortfolio()}<!-- readable:end -->`),
      },
    },
  ],
})


