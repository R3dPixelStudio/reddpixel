import assert from 'node:assert/strict'
import fs from 'node:fs'
import { JOURNAL_POSTS, journalPath } from '../src/content/journal.ts'

const html = fs.readFileSync('dist/index.html', 'utf8')
const robots = fs.readFileSync('dist/robots.txt', 'utf8')
const sitemap = fs.readFileSync('dist/sitemap.xml', 'utf8')
const tagContent = (name) => {
  const tag = html.match(new RegExp(`<meta (?:name|property)="${name}" content="([^"]+)"`))
  assert.ok(tag, `Missing ${name}`)
  return tag[1]
}
assert.match(html, /<title>REDDPIXEL — Creative Developer &amp; 3D Web Experiences<\/title>/)
assert.ok(tagContent('description').length > 80)
assert.match(html, /rel="canonical" href="https:\/\/reddpixel.com\/"/)
assert.equal(tagContent('og:url'), 'https://reddpixel.com/')
assert.equal(tagContent('og:type'), 'website')
assert.equal(tagContent('twitter:card'), 'summary_large_image')
assert.equal(tagContent('og:image'), tagContent('twitter:image'))
assert.ok(tagContent('og:image:alt'))
assert.ok(!tagContent('robots').includes('noindex'))
assert.ok(!/localhost|127\.0\.0\.1|pages\.dev/.test(html))
assert.ok(!/portfolio-(head|content) -->/.test(html))
const schema = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])
assert.deepEqual(schema['@graph'].map((node) => node['@type']), ['Person', 'WebSite'])
assert.equal(schema['@graph'][0].name, 'Arash Mohammadi')
for (const text of ['Arash Mohammadi', 'I BUILD DIGITAL AND PHYSICAL SYSTEMS', 'AlphaTradeZone', '3D Architect', 'Indie Protocol', 'Freelance VFX', 'Network &amp; RF Towers', 'Electrical Systems', '5 YRS', '1 YRS', 'mailto:arashmohammadi9775@gmail.com']) assert.ok(html.includes(text), `Missing static content: ${text}`)
assert.match(html, /<details id="portfolio-view" open>/)
for (const phase of ['intro', 'about', 'work', 'contact']) {
  assert.ok(!html.includes(`id="${phase}"`), `Static anchor collides with cinematic phase: ${phase}`)
}
for (const match of html.matchAll(/<img[^>]+src="([^"]+)"[^>]+alt="([^"]*)"/g)) {
  assert.ok(fs.existsSync(`dist${match[1]}`), `Missing image: ${match[1]}`)
  assert.ok(match[2], `Missing alt: ${match[1]}`)
}
assert.ok(fs.existsSync('dist/images/social-preview.jpg'))
assert.match(robots, /Sitemap: https:\/\/reddpixel.com\/sitemap.xml/)
assert.match(robots, /Disallow: \/api\//)
assert.deepEqual([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]), ['https://reddpixel.com/', 'https://reddpixel.com/blog/', ...JOURNAL_POSTS.map((post) => `https://reddpixel.com${journalPath(post)}`)])
const blogIndex = fs.readFileSync('dist/blog/index.html', 'utf8')
assert.ok(blogIndex.includes('href="https://reddpixel.com/blog/"'))
for (const post of JOURNAL_POSTS) {
  const article = fs.readFileSync(`dist${journalPath(post)}index.html`, 'utf8')
  assert.ok(article.includes(`href="https://reddpixel.com${journalPath(post)}"`))
  const graph = JSON.parse(article.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph']
  assert.equal(graph.find((item) => item['@type'] === 'BlogPosting').headline, post.title)
  assert.ok(article.includes('<pre><code>'))
  assert.ok(!/localhost|127\.0\.0\.1|pages\.dev|noindex/.test(article))
  assert.ok(blogIndex.includes(journalPath(post)))
}
console.log('Production homepage, blog/articles, clean metadata, JSON-LD, image paths, robots and generated sitemap verified.')
