import assert from 'node:assert/strict'
import { articleText, articleSections } from '../src/admin/editor.ts'
import { JOURNAL_POSTS } from '../src/content/journal.ts'
import { validPost, validWork, safeWebsite, safeMediaPath, baseWorks } from '../src/content/cms.ts'
for (const post of JOURNAL_POSTS) {
  assert.deepEqual(articleSections(articleText(post.sections)), post.sections, 'Editing must preserve every original paragraph and code block')
  assert.ok(validPost({ ...post, status: 'published', version: 0 }))
  assert.ok(!validPost({ ...post, slug: '../admin', status: 'published', version: 0 }))
}
for (const work of baseWorks()) assert.ok(validWork(work))
for (const path of ['//evil.example/photo.png', '/media/../api/cms/session', '/images/../../secret.txt', 'data:image/svg+xml,<svg/>']) assert.ok(!safeMediaPath(path))
for (const url of ['javascript:alert(1)', 'https://user:password@example.com/', 'http://example.com/']) assert.ok(!safeWebsite(url))
assert.ok(!validWork({ ...baseWorks()[0], url: 'javascript:alert(1)' }))
console.log('Article editing preserves original content; invalid slugs, media paths and unsafe work links are rejected.')
