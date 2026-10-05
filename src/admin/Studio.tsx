import { useEffect, useRef, useState } from 'react'
import { api, setCsrf, StudioApiError } from './api'
import { articleText, articleSections } from './editor'
import { type CmsPost, type CmsWork, type CmsComment, type CmsMedia } from '../content/cms'
import Signature from '../ui/art/Signature'
import MediaField from './MediaField'
import { MEDIA_ACCEPT, mediaDescription, uploadMedia, type UploadMedia } from './uploads'

type Page = 'posts' | 'works' | 'comments' | 'media'
type Entry = CmsPost | CmsWork | CmsComment | CmsMedia
const newPost = (): CmsPost => ({ slug: '', title: '', description: '', category: 'Field note', readingMinutes: 4, sections: [{ heading: 'The idea', paragraphs: [''] }], status: 'draft', version: 0 })
const newWork = (): CmsWork => ({ id: crypto.randomUUID(), branch: 'web', title: '', summary: '', url: '', cover: '', coverAlt: '', media: [], status: 'draft', version: 0 })

export default function Studio() {
  const [auth, setAuth] = useState<boolean | null>(null)
  const [needsSetup, setNeedsSetup] = useState(false)
  const [page, setPage] = useState<Page>('posts')
  const [entries, setEntries] = useState<Entry[]>([])
  const [editing, setEditing] = useState<CmsPost | CmsWork | null>(null)
  const [refresh, setRefresh] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)
  const [storage, setStorage] = useState<{ used: number; capacity: number } | null>(null)
  const lock = useRef(false)
  const live = useRef(true)
  const requests = useRef(new Set<AbortController>())
  useEffect(() => {
    live.current = true
    const controller = new AbortController()
    api<{ authenticated: boolean; csrf: string }>('session', {}, controller.signal).then(s => { if (!controller.signal.aborted) { setCsrf(s.csrf ?? ''); setAuth(s.authenticated) } }).catch(e => { if (!controller.signal.aborted) { setAuth(false); if (e instanceof StudioApiError && e.code === 'CMS_NOT_CONFIGURED') setNeedsSetup(true); else setError(e.message) } })
    const activeRequests = requests.current
    return () => { live.current = false; controller.abort(); for (const request of activeRequests) request.abort(); activeRequests.clear() }
  }, [])
  useEffect(() => {
    if (!auth) return
    const controller = new AbortController()
    queueMicrotask(() => { if (!controller.signal.aborted) setLoading(true) })
    api<{ items: Entry[]; storage?: { used: number; capacity: number } }>(page, {}, controller.signal).then(result => { if (!controller.signal.aborted) { setEntries(result.items); if (result.storage) setStorage(result.storage) } }).catch(e => { if (!controller.signal.aborted) setError(e.message) }).finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [auth, page, refresh])
  async function transfer<T>(task: (signal: AbortSignal) => Promise<T>, done: (result: T) => void): Promise<T | null> {
    if (lock.current) return null
    lock.current = true; setBusy(true); setError(''); setNotice('')
    const controller = new AbortController(); requests.current.add(controller)
    const timeout = setTimeout(() => controller.abort(), 120000)
    try {
      const result = await task(controller.signal)
      if (!controller.signal.aborted && live.current) { done(result); return result }
    } catch (e) {
      if (!controller.signal.aborted && live.current) setError(e instanceof Error ? e.message : 'Could not save.')
      else if (live.current) setError('The request timed out. Reload the list to check whether it saved before trying again.')
    } finally { clearTimeout(timeout); requests.current.delete(controller); lock.current = false; if (live.current) setBusy(false) }
    return null
  }
  const mutate = <T,>(path: string, options: RequestInit, done: (result: T) => void) => transfer(signal => api<T>(path, options, signal), done)
  const upload: UploadMedia = async (file, selected) => {
    if (!MEDIA_ACCEPT.split(',').includes(file.type) || file.size < 16 || file.size > (file.type.startsWith('video/') ? 20 : 8) * 1024 * 1024 || file.name.length > 180) { setError('Choose JPEG, PNG or WebP up to 8 MB, or MP4/WebM up to 20 MB, with a filename under 181 characters.'); return null }
    return transfer(signal => uploadMedia(file, signal, percent => { if (live.current && !signal.aborted) setNotice(`Uploading ${file.name} · ${percent}%`) }), media => { selected(media); setRefresh(n => n + 1); setNotice('Uploaded. Review the description, then save your article or work to publish this change.') })
  }
  const saved = () => { setEditing(null); setRefresh(n => n + 1); setNotice('Saved. Published content is available immediately; drafts stay private.') }
  const switchPage = (next: Page) => { if (busy || editing && !confirm('Discard unsaved changes and switch sections?')) return; setPage(next); setEditing(null); setEntries([]); setError(''); setNotice('') }
  return <div className="studio-shell"><header className="studio-header"><a href="/blog/">REDDPIXEL / CONTENT STUDIO</a><Signature /><a href="/">Portfolio ↗</a></header>
    {error && <p role="alert" className="studio-error">{error}</p>}{notice && <p role="status" className="studio-notice">{notice}</p>}
    {auth === null ? <p role="status">Opening the studio…</p> : needsSetup ? <section className="studio-login"><p className="eyebrow">FIRST SETUP</p><h1>Connect the studio.</h1><p>The live studio needs its Cloudflare database and password configuration before you can sign in.</p><ol><li>Bind your D1 database as <code>CMS_DB</code> and apply the database migration.</li><li>Add your password hash as the <code>ADMIN_PASSWORD_HASH</code> secret.</li><li>Redeploy the production site, then return here.</li></ol><p className="studio-hint">Follow docs/CMS.md in your project folder. Choose your password privately.</p><button onClick={() => window.location.reload()}>Check setup again ↗</button></section> : !auth ? <section className="studio-login"><p className="eyebrow">PRIVATE WORKSPACE</p><h1>Behind the red glass.</h1><p>Write field notes. Curate the work. Keep the conversation going.</p><form onSubmit={event => { event.preventDefault(); const password = new FormData(event.currentTarget).get('password'); void mutate<{ authenticated: boolean; csrf: string }>('session', { method: 'POST', body: JSON.stringify({ password }) }, s => { setCsrf(s.csrf); setAuth(s.authenticated); setNotice('Welcome back.') }) }}><label>Studio password<input type="password" name="password" autoComplete="current-password" minLength={16} maxLength={256} required /></label><button disabled={busy}>{busy ? 'Signing in…' : 'Enter studio ↗'}</button></form><p className="studio-hint">Use your private studio password. Photos and timelapses use the existing D1 database; no R2 account is needed.</p></section> : <>
      <nav className="studio-nav" aria-label="Studio sections">{(['posts', 'works', 'comments', 'media'] as Page[]).map(item => <button key={item} aria-current={page === item ? 'page' : undefined} disabled={busy} onClick={() => switchPage(item)}>{item === 'works' ? 'Work collections' : item}</button>)}<button disabled={busy} onClick={() => { if (editing && !confirm('Discard unsaved changes and sign out?')) return; void mutate('session', { method: 'DELETE' }, () => { setCsrf(''); setAuth(false); setEditing(null); setEntries([]) }) }}>Sign out</button></nav>
      {loading && <p role="status">Loading {page}…</p>}
      {editing && 'slug' in editing ? <PostEditor key={editing.slug || 'new'} item={editing} busy={busy} upload={upload} cancel={() => { if (confirm('Discard unsaved changes?')) setEditing(null) }} save={item => void mutate('posts', { method: 'PUT', body: JSON.stringify(item) }, saved)} /> : editing ? <WorkEditor key={editing.id} item={editing} busy={busy} upload={upload} cancel={() => { if (confirm('Discard unsaved changes?')) setEditing(null) }} save={item => void mutate('works', { method: 'PUT', body: JSON.stringify(item) }, saved)} /> : <main>
        <div className="studio-title"><div><p className="eyebrow">YOUR PRACTICE / {page.toUpperCase()}</p><h1>{page === 'posts' ? 'Field notes.' : page === 'works' ? 'The collection.' : page === 'comments' ? 'The conversation.' : 'Media library.'}</h1></div>{(page === 'posts' || page === 'works') && <button disabled={busy || loading} onClick={() => setEditing(page === 'posts' ? newPost() : newWork())}>+ New {page === 'posts' ? 'article' : 'work'}</button>}</div>
        {page === 'posts' && <div className="studio-list">{(entries as CmsPost[]).map(post => <article key={post.slug}><div><span className="status-tag">{post.status}</span><h2>{post.title}</h2><p>{post.description}</p></div><button disabled={busy} onClick={() => setEditing(post)}>Edit article ↗</button><a href={post.status === 'published' ? `/blog/${post.slug}/` : `/api/cms/preview?slug=${encodeURIComponent(post.slug)}`} target="_blank" rel="noopener noreferrer">{post.status === 'published' ? 'View ↗' : 'Preview saved draft ↗'}</a></article>)}</div>}
        {page === 'works' && <div className="studio-list">{(entries as CmsWork[]).map(work => <article key={work.id}><img src={work.cover} alt={work.coverAlt} loading="lazy" /><div><span className="status-tag">{work.branch === 'web' ? 'Websites' : work.branch === 'vfx' ? 'Visuals' : 'Technical work'} / {work.status}</span><h2>{work.title}</h2><p>{work.summary}</p></div><button disabled={busy} onClick={() => setEditing(work)}>Edit work ↗</button></article>)}</div>}
        {page === 'comments' && <><p className="studio-hint">New visitor comments stay private until approved. Hide returns a published comment to a private state. Replies appear as Arash / REDDPIXEL.</p><div className="studio-list">{(entries as CmsComment[]).map(comment => <CommentEditor key={comment.id + comment.status + comment.reply} comment={comment} busy={busy} save={value => void mutate('comments', { method: 'PUT', body: JSON.stringify(value) }, () => { setRefresh(n => n + 1); setNotice('Comment moderation saved.') })} />)}{!entries.length && !loading && <p>No comments yet.</p>}</div></>}
        {page === 'media' && <><p className="studio-hint">Photos and compressed timelapses are stored in your existing D1 database. JPEG, PNG, WebP: up to 8 MB. MP4, WebM: up to 20 MB. Upload here or directly inside an article/work editor.</p>{storage && <div className="storage-meter"><label>Media storage · {(storage.used / 1024 / 1024).toFixed(1)} / {storage.capacity / 1024 / 1024} MB<meter min={0} max={storage.capacity} value={storage.used} /></label><small>The media budget leaves database space for your content. No R2 binding is needed.</small></div>}<label className="upload-label">{busy ? 'Uploading…' : '+ Upload media'}<input type="file" accept={MEDIA_ACCEPT} disabled={busy} onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void upload(file, () => {}) }} /></label><div className="studio-media">{(entries as CmsMedia[]).map(media => <article key={media.key}>{media.type === 'video' ? <video src={media.src} controls playsInline preload="metadata" /> : <img src={media.src} alt={media.name} loading="lazy" />}<h2>{media.name}</h2><p>{(media.bytes / 1024 / 1024).toFixed(1)} MB</p><input aria-label={`Media path for ${media.name}`} readOnly value={media.src} onFocus={event => event.currentTarget.select()} /></article>)}</div></>}
      </main>}
    </>}
  </div>
}

type EditorProps = { busy: boolean; upload: UploadMedia; cancel: () => void }
function PostEditor({ item, busy, upload, save, cancel }: EditorProps & { item: CmsPost; save: (p: CmsPost) => void }) {
  const [post, setPost] = useState(item)
  const [body, setBody] = useState(articleText(item.sections))
  const change = (key: keyof CmsPost, value: string | number) => setPost(p => ({ ...p, [key]: value }))
  return <form className="studio-editor" onSubmit={event => { event.preventDefault(); save({ ...post, sections: articleSections(body) }) }}>
    <p className="eyebrow">ARTICLE EDITOR</p><h1>{item.title || 'A new field note.'}</h1><fieldset className="editor-fields" disabled={busy}>
      <div className="form-grid"><label>Title<input value={post.title} maxLength={180} required minLength={3} onChange={e => change('title', e.target.value)} /></label><label>URL slug<input value={post.slug} readOnly={!!item.slug} pattern="[a-z0-9]+(-[a-z0-9]+)*" minLength={3} maxLength={90} required onChange={e => change('slug', e.target.value)} /><small>Lowercase words with hyphens. Fixed after creating the article.</small></label><label>Category<input value={post.category} required maxLength={60} onChange={e => change('category', e.target.value)} /></label><label>Reading time (minutes)<input type="number" min={1} max={60} value={post.readingMinutes} required onChange={e => change('readingMinutes', Number(e.target.value))} /></label></div>
      <label>Summary<textarea value={post.description} minLength={10} maxLength={500} required onChange={e => change('description', e.target.value)} /></label>
      <div className="form-grid"><MediaField label="Article cover" src={post.cover ?? ''} imagesOnly busy={busy} upload={upload} change={src => change('cover', src)} select={media => setPost(p => ({ ...p, cover: media.src, coverAlt: p.coverAlt || mediaDescription(media.name) }))} /><label>Cover image description<input value={post.coverAlt ?? ''} required={!!post.cover} minLength={post.cover ? 3 : undefined} maxLength={300} onChange={e => change('coverAlt', e.target.value)} /></label></div>
      <label>Article body<textarea className="body-editor" value={body} required onChange={e => setBody(e.target.value)} /><small>Start each section with ## Heading. Separate paragraphs with a blank line. Use triple backticks around a code block. Content is rendered as safe text, without arbitrary HTML.</small></label>
    </fieldset><EditorActions busy={busy} status={post.status} change={value => change('status', value)} cancel={cancel} />
  </form>
}
function WorkEditor({ item, busy, upload, save, cancel }: EditorProps & { item: CmsWork; save: (w: CmsWork) => void }) {
  const [work, setWork] = useState(item)
  const [adding, setAdding] = useState(false)
  const mounted = useRef(true)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  const disabled = busy || adding
  const change = (key: keyof CmsWork, value: string) => setWork(w => ({ ...w, [key]: value }))
  const addFiles = async (files: File[]) => {
    setAdding(true)
    try {
      for (const file of files.slice(0, 50 - work.media.length)) {
        if (!mounted.current) break
        const media = await upload(file, media => setWork(w => ({ ...w, media: [...w.media, { type: media.type, src: media.src, alt: mediaDescription(media.name) }], ...(!w.cover && media.type === 'image' ? { cover: media.src, coverAlt: mediaDescription(media.name) } : {}) })))
        if (!media) break
      }
    } finally { if (mounted.current) setAdding(false) }
  }
  return <form className="studio-editor" onSubmit={event => { event.preventDefault(); if (!disabled) save(work) }}>
    <p className="eyebrow">WORK EDITOR</p><h1>{item.title || 'Add to the practice.'}</h1><fieldset className="editor-fields" disabled={disabled}>
      <div className="form-grid"><label>Title<input value={work.title} minLength={2} maxLength={180} required onChange={e => change('title', e.target.value)} /></label><label>Collection<select value={work.branch} onChange={e => change('branch', e.target.value)}><option value="web">Websites</option><option value="vfx">Visuals</option><option value="kinetic">Technical work</option></select></label></div>
      <label>Description<textarea value={work.summary} minLength={10} maxLength={2000} required onChange={e => change('summary', e.target.value)} /></label><label>Website URL (optional)<input type="url" value={work.url} placeholder="https://…" onChange={e => change('url', e.target.value)} /></label>
      <div className="form-grid"><MediaField label="Work cover" src={work.cover} required imagesOnly busy={disabled} upload={upload} change={src => change('cover', src)} select={media => setWork(w => ({ ...w, cover: media.src, coverAlt: w.coverAlt || mediaDescription(media.name) }))} /><label>Cover image description<input value={work.coverAlt} required minLength={3} maxLength={300} onChange={e => change('coverAlt', e.target.value)} /></label></div>
      <h2>Gallery & timelapses</h2><p className="studio-hint">Upload photos/videos here, or choose existing files from the library. Replacing a file updates this entry when you save; its original remains in the library. Review the descriptions for accessibility.</p>
      {work.media.map((media, index) => <fieldset key={index} className="media-row"><legend>Media {index + 1}</legend>
        <MediaField label={`Gallery media ${index + 1}`} src={media.src} type={media.type} required busy={disabled} upload={upload} change={src => setWork(w => ({ ...w, media: w.media.map((m, i) => i === index ? { ...m, src } : m) }))} select={picked => setWork(w => ({ ...w, media: w.media.map((m, i) => i === index ? { ...m, src: picked.src, type: picked.type, alt: m.alt || mediaDescription(picked.name) } : m) }))} />
        <label>Type<select value={media.type} onChange={e => setWork(w => ({ ...w, media: w.media.map((m, i) => i === index ? { ...m, type: e.target.value as 'image' | 'video' } : m) }))}><option value="image">Image</option><option value="video">Timelapse / video</option></select></label>
        <label>Description<input value={media.alt} minLength={3} maxLength={300} required onChange={e => setWork(w => ({ ...w, media: w.media.map((m, i) => i === index ? { ...m, alt: e.target.value } : m) }))} /></label><button type="button" onClick={() => setWork(w => ({ ...w, media: w.media.filter((_, i) => i !== index) }))}>Remove from gallery</button>
      </fieldset>)}
      <div className="media-field-actions"><label className="upload-label">{adding ? 'Uploading gallery…' : '↥ Upload gallery files'}<input type="file" aria-label="Upload gallery files" accept={MEDIA_ACCEPT} multiple disabled={disabled || work.media.length >= 50} onChange={event => { const files = Array.from(event.target.files ?? []); event.target.value = ''; if (files.length) void addFiles(files) }} /></label><button type="button" disabled={work.media.length >= 50} onClick={() => setWork(w => ({ ...w, media: [...w.media, { type: 'image', src: '', alt: '' }] }))}>+ Add from library / existing path</button></div>
    </fieldset><EditorActions busy={disabled} status={work.status} change={value => change('status', value)} cancel={cancel} />
  </form>
}
function EditorActions({ busy, status, change, cancel }: { busy: boolean; status: string; change: (s: string) => void; cancel: () => void }) {
  return <div className="editor-actions"><label>Visibility<select disabled={busy} value={status} onChange={e => change(e.target.value)}><option value="draft">Draft · private</option><option value="published">Published · public</option></select></label><button disabled={busy}>{busy ? 'Saving…' : status === 'published' ? 'Save & publish ↗' : 'Save draft'}</button><button type="button" disabled={busy} onClick={cancel}>Cancel</button></div>
}
function CommentEditor({ comment, busy, save }: { comment: CmsComment; busy: boolean; save: (value: { id: string; status: string; reply: string }) => void }) {
  const [reply, setReply] = useState(comment.reply)
  const submit = (status: string) => save({ id: comment.id, status, reply })
  return <article className="comment-editor"><div><span className="status-tag">{comment.status} / {comment.slug}</span><h2>{comment.name}</h2><p>{comment.text}</p><label>Your reply<textarea value={reply} maxLength={3000} onChange={e => setReply(e.target.value)} /></label><div className="comment-actions"><button disabled={busy} onClick={() => submit('approved')}>Approve & save reply</button><button disabled={busy} onClick={() => submit('hidden')}>Hide</button><button disabled={busy} onClick={() => submit('pending')}>Keep pending</button></div></div></article>
}
