import { createRoot } from 'react-dom/client'

const art = document.getElementById('journal-art-root')
const controllers = new Set<AbortController>()
const hidden = () => document.documentElement.toggleAttribute('data-page-hidden', document.hidden)
document.addEventListener('visibilitychange', hidden)
hidden()
const observer = new IntersectionObserver(entries => {
  for (const entry of entries) if (entry.isIntersecting) { entry.target.classList.add('is-revealed'); observer.unobserve(entry.target) }
}, { threshold: .05 })
document.querySelectorAll('[data-reveal]').forEach(element => observer.observe(element))
if (art && matchMedia('(min-width: 768px)').matches && !matchMedia('(prefers-reduced-motion: reduce)').matches && !(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData) {
  const start = new IntersectionObserver(entries => {
    if (!entries.some(e => e.isIntersecting)) return
    start.disconnect()
    void import('./JournalArt').then(({ default: JournalArt }) => { if (art.isConnected) createRoot(art).render(<JournalArt />) }).catch(() => { /* The CSS glass sculpture remains visible. */ })
  }, { rootMargin: '100px' })
  start.observe(art)
  window.addEventListener('pagehide', () => start.disconnect(), { once: true })
}
document.querySelectorAll<HTMLFormElement>('.comment-form').forEach(form => {
  const fieldset = form.querySelector('fieldset')
  if (fieldset) fieldset.disabled = false
  form.addEventListener('submit', async event => {
    event.preventDefault()
    const button = form.querySelector<HTMLButtonElement>('button')!, status = form.querySelector<HTMLElement>('[role=status]')!
    if (button.disabled) return
    const data = new FormData(form), controller = new AbortController()
    controllers.add(controller); button.disabled = true; status.textContent = 'Sending for approval…'
    const timeout = setTimeout(() => controller.abort(), 20000)
    try {
      const response = await fetch('/api/cms/comments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(data)), signal: controller.signal })
      const result = await response.json()
      status.textContent = response.ok ? result.message : result.error ?? 'Could not send your comment.'
      if (response.ok) form.reset()
    } catch { status.textContent = 'Could not send right now. Please try again later.' } finally { clearTimeout(timeout); controllers.delete(controller); button.disabled = false }
  })
})
const incoming = new URLSearchParams(location.search)
const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']
document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach(anchor => {
  const target = new URL(anchor.href, location.href)
  if (target.origin !== location.origin) return
  keys.forEach(key => { if (incoming.has(key)) target.searchParams.set(key, incoming.get(key)!) })
  anchor.href = target.pathname + target.search + target.hash
})
window.addEventListener('pagehide', () => { observer.disconnect(); for (const controller of controllers) controller.abort(); controllers.clear() }, { once: true })
