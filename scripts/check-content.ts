import assert from 'node:assert/strict'
import { articleText, articleSections } from '../src/admin/editor.ts'
import { JOURNAL_POSTS } from '../src/content/journal.ts'
import { validPost, validWork, safeWebsite, safeMediaPath, baseWorks, mergeStoredWorks, workCollections } from '../src/content/cms.ts'
for (const post of JOURNAL_POSTS) {
  assert.deepEqual(articleSections(articleText(post.sections)), post.sections, 'Editing must preserve every original paragraph and code block')
  assert.ok(validPost({ ...post, status: 'published', version: 0 }))
  assert.ok(!validPost({ ...post, slug: '../admin', status: 'published', version: 0 }))
}
for (const work of baseWorks()) assert.ok(validWork(work))
const technicalDrafts = baseWorks().filter(work => work.branch === 'kinetic' && work.status === 'draft')
assert.equal(technicalDrafts.length, 2)
assert.ok(technicalDrafts.every(work => work.status === 'draft' && !validWork({ ...work, status: 'published' })), 'Unfinished technical projects must stay private')
const cafe = mergeStoredWorks([]).find(work => work.id === 'cafe-shariati')!
assert.ok(cafe && validWork(cafe) && cafe.status === 'published')
assert.equal(cafe.media[0].type, 'video')
assert.match(cafe.media[0].src, /^\/media\/[a-f0-9-]{36}\.mp4$/)
assert.ok(cafe.media[0].poster)
const ownerCafe = { ...cafe, status: 'draft' as const, summary: 'Owner-edited project description, still awaiting approval.', version: 3 }
assert.ok(!mergeStoredWorks([ownerCafe]).some(work => work.id === cafe.id), 'An owner-saved draft must not be republished by source defaults')
assert.deepEqual(mergeStoredWorks([ownerCafe], true).find(work => work.id === cafe.id), ownerCafe)
const alpha = baseWorks().find(work => work.id === 'alphatradezone')!
const ownerAlpha = { ...alpha, summary: 'Owner-edited copy that must survive the media refresh.', url: 'https://owner.example/', cover: '/images/optimized/project1-1200.webp', media: [{ type: 'image' as const, src: '/images/optimized/project1-1200.webp', alt: 'Old repository screenshot' }, { type: 'image' as const, src: '/media/owner-photo.webp', alt: 'Owner uploaded media' }], version: 2 }
const refreshed = mergeStoredWorks([ownerAlpha]).find(work => work.id === alpha.id)!
assert.equal(refreshed.summary, ownerAlpha.summary)
assert.equal(refreshed.url, ownerAlpha.url)
assert.equal(refreshed.version, 2)
assert.equal(refreshed.cover, alpha.cover)
assert.ok(refreshed.media.some(media => media.src === '/media/owner-photo.webp'))
assert.equal(workCollections(mergeStoredWorks([])).find(category => category.id === 'vfx')?.projects.filter(project => project.visualCategory === 'architecture').length, 3)
assert.deepEqual(workCollections([...mergeStoredWorks([])].reverse()).find(category => category.id === 'web')?.projects.slice(0, 3).map(project => project.subId), ['alphatradezone', 'abi-mobile', 'Architect'], 'Website order must survive a differently ordered CMS response')
assert.deepEqual(workCollections([...mergeStoredWorks([])].reverse()).find(category => category.id === 'vfx')?.projects.slice(0, 3).map(project => project.subId), ['damavand-villa', 'jaryan', 'hormozan-hospital'], 'Damavand must lead the CMS-backed architectural collection')
assert.ok(!validWork({ ...alpha, media: [{ type: 'video', src: '/media/film.mp4', alt: 'Installation film', poster: '//evil.example/poster.png' }] }))
for (const path of ['//evil.example/photo.png', '/media/../api/cms/session', '/images/../../secret.txt', '/videos/work/../secret.mp4', '/videos/work/cafe-shariati/film.html', 'data:image/svg+xml,<svg/>']) assert.ok(!safeMediaPath(path))
for (const url of ['javascript:alert(1)', 'https://user:password@example.com/', 'http://example.com/']) assert.ok(!safeWebsite(url))
assert.ok(!validWork({ ...baseWorks()[0], url: 'javascript:alert(1)' }))
console.log('Article editing preserves original content; invalid slugs, media paths and unsafe work links are rejected.')
