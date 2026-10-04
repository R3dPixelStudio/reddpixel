import { useEffect, useRef, useState } from 'react'
import { api, setCsrf } from './api'
import { articleText, articleSections } from './editor'
import { type CmsPost, type CmsWork, type CmsComment, type CmsMedia } from '../content/cms'
import Signature from '../ui/art/Signature'

type Page = 'posts' | 'works' | 'comments' | 'media'
type Entry = CmsPost | CmsWork | CmsComment | CmsMedia
const newPost = (): CmsPost => ({ slug: '', title: '', description: '', category: 'Field note', readingMinutes: 4, sections: [{ heading: 'The idea', paragraphs: [''] }], status: 'draft', version: 0 })
const newWork = (): CmsWork => ({ id: crypto.randomUUID(), branch: 'web', title: '', summary: '', url: '', cover: '', coverAlt: '', media: [], status: 'draft', version: 0 })

export default function Studio() {
  const [auth, setAuth] = useState<boolean | null>(null)
  const [page, setPage] = useState<Page>('posts')
  const [entries, setEntries] = useState<Entry[]>([])
  const [editing, setEditing] = useState<CmsPost | CmsWork | null>(null)
  const [refresh, setRefresh] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)
  const lock = useRef(false)
  const live = useRef(true)
  const requests = useRef(new Set<AbortController>())
  useEffect(() => {
    live.current = true
    const controller = new AbortController()
    api<{ authenticated: boolean; csrf: string }>('session', {}, controller.signal).then(s => { setCsrf(s.csrf ?? ''); setAuth(s.authenticated) }).catch(e => { if (!controller.signal.aborted) { setAuth(false); setError(e.message) } })
    const activeRequests = requests.current
    return () => { live.current = false; controller.abort(); for (const request of activeRequests) request.abort(); activeRequests.clear() }
  }, [])
  useEffect(() => {
    if (!auth) return
    const controller = new AbortController()
    // Loading state is owned by the request, including tab switches.
    queueMicrotask(() => { if (!controller.signal.aborted) setLoading(true) })
    api<{ items: Entry[] }>(page, {}, controller.signal).then(result => { if (!controller.signal.aborted) setEntries(result.items) }).catch(e => { if (!controller.signal.aborted) setError(e.message) }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [auth, page, refresh])
  async function mutate<T>(path: string, options: RequestInit, done: (result: T) => void) {
    if (lock.current) return
    lock.current = true; setBusy(true); setError(''); setNotice('')
    const controller = new AbortController(); requests.current.add(controller)
    const timeout = setTimeout(() => controller.abort(), 120000)
    try { const result = await api<T>(path, options, controller.signal); if (!controller.signal.aborted && live.current) done(result) } catch (e) { if (!controller.signal.aborted && live.current) setError(e instanceof Error ? e.message : 'Could not save.'); else if (live.current) setError('The request timed out. Reload the list to check whether it saved before trying again.') } finally { clearTimeout(timeout); requests.current.delete(controller); lock.current = false; if (live.current) setBusy(false) }
  }
  const saved = () => { setEditing(null); setRefresh(n => n + 1); setNotice('Saved. Published content is available immediately; drafts stay private.') }
  const switchPage = (next: Page) => { if (busy || editing && !confirm('Discard unsaved changes and switch sections?')) return; setPage(next); setEditing(null); setEntries([]); setError(''); setNotice('') }
  return <div className="studio-shell"><header className="studio-header"><a href="/blog/">REDDPIXEL / CONTENT STUDIO</a><Signature /><a href="/">Portfolio ↗</a></header>
    {error && <p role="alert" className="studio-error">{error}</p>}{notice && <p role="status" className="studio-notice">{notice}</p>}
    {auth === null ? <p role="status">Opening the studio…</p> : !auth ? <section className="studio-login"><p className="eyebrow">PRIVATE WORKSPACE</p><h1>Behind the red glass.</h1><p>Write field notes. Curate the work. Keep the conversation going.</p><form onSubmit={event => { event.preventDefault(); const password = new FormData(event.currentTarget).get('password'); void mutate<{ authenticated: boolean; csrf: string }>('session', { method: 'POST', body: JSON.stringify({ password }) }, s => { setCsrf(s.csrf); setAuth(s.authenticated); setNotice('Welcome back.') }) }}><label>Studio password<input type="password" name="password" autoComplete="current-password" minLength={16} maxLength={256} required /></label><button disabled={busy}>{busy ? 'Signing in…' : 'Enter studio ↗'}</button></form><p className="studio-hint">First setup is documented in docs/CMS.md. The studio stays locked until storage and a password hash are configured.</p></section> : <>
      <nav className="studio-nav" aria-label="Studio sections">{(['posts', 'works', 'comments', 'media'] as Page[]).map(item => <button key={item} aria-current={page === item ? 'page' : undefined} disabled={busy} onClick={() => switchPage(item)}>{item === 'works' ? 'Work collections' : item}</button>)}<button disabled={busy} onClick={() => { if (editing && !confirm('Discard unsaved changes and sign out?')) return; void mutate('session', { method: 'DELETE' }, () => { setCsrf(''); setAuth(false); setEditing(null); setEntries([]) }) }}>Sign out</button></nav>
      {loading && <p role="status">Loading {page}…</p>}
      {editing && 'slug' in editing ? <PostEditor key={editing.slug || 'new'} item={editing} busy={busy} cancel={() => { if (confirm('Discard unsaved changes?')) setEditing(null) }} save={item => void mutate('posts', { method: 'PUT', body: JSON.stringify(item) }, saved)} /> : editing ? <WorkEditor key={editing.id} item={editing} busy={busy} cancel={() => { if (confirm('Discard unsaved changes?')) setEditing(null) }} save={item => void mutate('works', { method: 'PUT', body: JSON.stringify(item) }, saved)} /> : <main>
        <div className="studio-title"><div><p className="eyebrow">YOUR PRACTICE / {page.toUpperCase()}</p><h1>{page === 'posts' ? 'Field notes.' : page === 'works' ? 'The collection.' : page === 'comments' ? 'The conversation.' : 'Media library.'}</h1></div>{(page === 'posts' || page === 'works') && <button disabled={busy || loading} onClick={() => setEditing(page === 'posts' ? newPost() : newWork())}>+ New {page === 'posts' ? 'article' : 'work'}</button>}</div>
        {page === 'posts' && <div className="studio-list">{(entries as CmsPost[]).map(post => <article key={post.slug}><div><span className="status-tag">{post.status}</span><h2>{post.title}</h2><p>{post.description}</p></div><button disabled={busy} onClick={() => setEditing(post)}>Edit article ↗</button><a href={post.status === 'published' ? `/blog/${post.slug}/` : `/api/cms/preview?slug=${encodeURIComponent(post.slug)}`} target="_blank" rel="noopener noreferrer">{post.status === 'published' ? 'View ↗' : 'Preview saved draft ↗'}</a></article>)}</div>}
        {page === 'works' && <div className="studio-list">{(entries as CmsWork[]).map(work => <article key={work.id}><img src={work.cover} alt={work.coverAlt} loading="lazy" /><div><span className="status-tag">{work.branch === 'web' ? 'Websites' : work.branch === 'vfx' ? 'Visuals' : 'Technical work'} / {work.status}</span><h2>{work.title}</h2><p>{work.summary}</p></div><button disabled={busy} onClick={() => setEditing(work)}>Edit work ↗</button></article>)}</div>}
        {page === 'comments' && <><p className="studio-hint">New visitor comments stay private until approved. Hide returns a published comment to a private state. Replies appear as Arash / REDDPIXEL.</p><div className="studio-list">{(entries as CmsComment[]).map(comment => <CommentEditor key={comment.id + comment.status + comment.reply} comment={comment} busy={busy} save={value => void mutate('comments', { method: 'PUT', body: JSON.stringify(value) }, () => { setRefresh(n => n + 1); setNotice('Comment moderation saved.') })} />)}{!entries.length && !loading && <p>No comments yet.</p>}</div></>}
        {page === 'media' && <><p className="studio-hint">Upload images (JPEG, PNG, WebP, up to 8 MB) or timelapses (MP4, WebM, up to 40 MB). Compress videos before uploading. Copy a media path into an article cover or a work gallery.</p><label className="upload-label">{busy ? 'Uploading…' : '+ Upload media'}<input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" disabled={busy} onChange={event => { const file = event.target.files?.[0]; if (!file) return; void mutate<{ item: CmsMedia }>('media', { method: 'POST', body: file, headers: { 'Content-Type': file.type, 'X-File-Name': encodeURIComponent(file.name) } }, () => { setRefresh(n => n + 1); setNotice('Media uploaded. Add its path to your content and provide a useful description.') }); event.target.value = '' }} /></label><div className="studio-media">{(entries as CmsMedia[]).map(media => <article key={media.key}>{media.type === 'video' ? <video src={media.src} controls playsInline preload="metadata" /> : <img src={media.src} alt={media.name} loading="lazy" />}<h2>{media.name}</h2><p>{(media.bytes / 1024 / 1024).toFixed(1)} MB</p><input aria-label={`Media path for ${media.name}`} readOnly value={media.src} onFocus={event => event.currentTarget.select()} /></article>)}</div></>}
      </main>}
    </>}
  </div>
}

function PostEditor({ item, busy, save, cancel }: { item: CmsPost; busy: boolean; save: (p: CmsPost) => void; cancel: () => void }) {
  const [post, setPost] = useState(item)
  const [body, setBody] = useState(articleText(item.sections))
  const change = (key: keyof CmsPost, value: string | number) => setPost(p => ({ ...p, [key]: value }))
  return <form className="studio-editor" onSubmit={event => { event.preventDefault(); save({ ...post, sections: articleSections(body) }) }}><p className="eyebrow">ARTICLE EDITOR</p><h1>{item.title || 'A new field note.'}</h1><div className="form-grid"><label>Title<input value={post.title} maxLength={180} required minLength={3} onChange={e => change('title', e.target.value)} /></label><label>URL slug<input value={post.slug} readOnly={!!item.slug} pattern="[a-z0-9]+(-[a-z0-9]+)*" minLength={3} maxLength={90} required onChange={e => change('slug', e.target.value)} /><small>Lowercase words with hyphens. Fixed after creating the article.</small></label><label>Category<input value={post.category} required maxLength={60} onChange={e => change('category', e.target.value)} /></label><label>Reading time (minutes)<input type="number" min={1} max={60} value={post.readingMinutes} required onChange={e => change('readingMinutes', Number(e.target.value))} /></label></div><label>Summary<textarea value={post.description} minLength={10} maxLength={500} required onChange={e => change('description', e.target.value)} /></label><div className="form-grid"><label>Cover image path<input value={post.cover ?? ''} placeholder="/media/… or /images/…" onChange={e => change('cover', e.target.value)} /></label><label>Cover image description<input value={post.coverAlt ?? ''} required={!!post.cover} maxLength={300} onChange={e => change('coverAlt', e.target.value)} /></label></div><label>Article body<textarea className="body-editor" value={body} required onChange={e => setBody(e.target.value)} /><small>Start each section with ## Heading. Separate paragraphs with a blank line. Use triple backticks around a code block. Content is rendered as safe text, without arbitrary HTML.</small></label><EditorActions busy={busy} status={post.status} change={value => change('status', value)} cancel={cancel} /></form>
}
function WorkEditor({ item, busy, save, cancel }: { item: CmsWork; busy: boolean; save: (w: CmsWork) => void; cancel: () => void }) {
  const [work, setWork] = useState(item)
  const change = (key: keyof CmsWork, value: string) => setWork(w => ({ ...w, [key]: value }))
  return <form className="studio-editor" onSubmit={event => { event.preventDefault(); save(work) }}><p className="eyebrow">WORK EDITOR</p><h1>{item.title || 'Add to the practice.'}</h1><div className="form-grid"><label>Title<input value={work.title} minLength={2} maxLength={180} required onChange={e => change('title', e.target.value)} /></label><label>Collection<select value={work.branch} onChange={e => change('branch', e.target.value)}><option value="web">Websites</option><option value="vfx">Visuals</option><option value="kinetic">Technical work</option></select></label></div><label>Description<textarea value={work.summary} minLength={10} maxLength={2000} required onChange={e => change('summary', e.target.value)} /></label><label>Website URL (optional)<input type="url" value={work.url} placeholder="https://…" onChange={e => change('url', e.target.value)} /></label><div className="form-grid"><label>Cover image path<input value={work.cover} required onChange={e => change('cover', e.target.value)} /></label><label>Cover image description<input value={work.coverAlt} required minLength={3} maxLength={300} onChange={e => change('coverAlt', e.target.value)} /></label></div><h2>Gallery & timelapses</h2><p className="studio-hint">Upload files in Media first. Technical galleries show these entries; include the cover here too if you want it in that gallery.</p>{work.media.map((media, index) => <fieldset key={index} className="media-row"><legend>Media {index + 1}</legend><label>Type<select value={media.type} onChange={e => setWork(w => ({ ...w, media: w.media.map((m, i) => i === index ? { ...m, type: e.target.value as 'image' | 'video' } : m) }))}><option value="image">Image</option><option value="video">Timelapse / video</option></select></label><label>Media path<input value={media.src} required onChange={e => setWork(w => ({ ...w, media: w.media.map((m, i) => i === index ? { ...m, src: e.target.value } : m) }))} /></label><label>Description<input value={media.alt} minLength={3} maxLength={300} required onChange={e => setWork(w => ({ ...w, media: w.media.map((m, i) => i === index ? { ...m, alt: e.target.value } : m) }))} /></label><button type="button" disabled={busy} onClick={() => setWork(w => ({ ...w, media: w.media.filter((_, i) => i !== index) }))}>Remove from gallery</button></fieldset>)}<button type="button" disabled={busy || work.media.length >= 50} onClick={() => setWork(w => ({ ...w, media: [...w.media, { type: 'image', src: '', alt: '' }] }))}>+ Add gallery media</button><EditorActions busy={busy} status={work.status} change={value => change('status', value)} cancel={cancel} /></form>
}
function EditorActions({ busy, status, change, cancel }: { busy: boolean; status: string; change: (s: string) => void; cancel: () => void }) {
  return <div className="editor-actions"><label>Visibility<select value={status} onChange={e => change(e.target.value)}><option value="draft">Draft · private</option><option value="published">Published · public</option></select></label><button disabled={busy}>{busy ? 'Saving…' : status === 'published' ? 'Save & publish ↗' : 'Save draft'}</button><button type="button" disabled={busy} onClick={cancel}>Cancel</button></div>
}
function CommentEditor({ comment, busy, save }: { comment: CmsComment; busy: boolean; save: (value: { id: string; status: string; reply: string }) => void }) {
  const [reply, setReply] = useState(comment.reply)
  const submit = (status: string) => save({ id: comment.id, status, reply })
  return <article className="comment-editor"><div><span className="status-tag">{comment.status} / {comment.slug}</span><h2>{comment.name}</h2><p>{comment.text}</p><label>Your reply<textarea value={reply} maxLength={3000} onChange={e => setReply(e.target.value)} /></label><div className="comment-actions"><button disabled={busy} onClick={() => submit('approved')}>Approve & save reply</button><button disabled={busy} onClick={() => submit('hidden')}>Hide</button><button disabled={busy} onClick={() => submit('pending')}>Keep pending</button></div></div></article>
}


