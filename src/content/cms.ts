import type { JournalPost } from './journal'
import { SHOWCASES, type MediaItem, type ShowcaseCategory } from './portfolio.ts'

export interface CmsPost extends JournalPost { status: 'draft' | 'published'; version: number; cover?: string; coverAlt?: string; publishedAt?: string }
export interface CmsWork { id: string; branch: 'web' | 'vfx' | 'kinetic'; title: string; summary: string; url: string; cover: string; coverAlt: string; media: MediaItem[]; status: 'draft' | 'published'; version: number }
export interface CmsComment { id: string; slug: string; name: string; text: string; status: 'pending' | 'approved' | 'hidden'; reply: string; createdAt: string }
export interface CmsMedia { key: string; src: string; type: 'image' | 'video'; name: string; bytes: number }
export const baseWorks = (): CmsWork[] => SHOWCASES.flatMap(category => category.projects.map(project => ({ id: project.subId, branch: category.id as CmsWork['branch'], title: project.name, summary: project.desc, url: project.link ?? '', cover: project.cover, coverAlt: project.coverAlt, media: project.gallery, status: 'published', version: 0 })))
export function workCollections(items: CmsWork[]): ShowcaseCategory[] {
  return SHOWCASES.map(category => ({ ...category, projects: items.filter(item => item.branch === category.id && item.status === 'published').map(item => ({ subId: item.id, name: item.title, desc: item.summary, cover: item.cover, coverAlt: item.coverAlt, gallery: item.media, hasLink: !!item.url, ...(item.url ? { link: item.url } : {}) })) }))
}
const text = (value: unknown, min: number, max: number): value is string => typeof value === 'string' && value.trim().length >= min && value.length <= max && !Array.from(value).some(char => char.charCodeAt(0) < 32 && ![9, 10, 13].includes(char.charCodeAt(0)))
export const safeMediaPath = (value: unknown): value is string => typeof value === 'string' && /^\/(?:images\/[a-zA-Z0-9_./-]+|media\/[a-zA-Z0-9_-]+\.(?:jpg|png|webp|mp4|webm))$/.test(value) && !value.includes('..')
export const safeWebsite = (value: unknown): value is string => {
  if (value === '') return true
  if (typeof value !== 'string' || value.length > 500) return false
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password } catch { return false }
}
export function validPost(value: unknown): value is CmsPost {
  if (!value || typeof value !== 'object') return false
  const p = value as CmsPost
  return text(p.slug, 3, 90) && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug) && text(p.title, 3, 180) && text(p.description, 10, 500) && text(p.category, 2, 60) && Number.isInteger(p.readingMinutes) && p.readingMinutes >= 1 && p.readingMinutes <= 60 && ['draft', 'published'].includes(p.status) && Number.isInteger(p.version) && p.version >= 0 && (!p.cover || safeMediaPath(p.cover)) && (!p.cover || text(p.coverAlt, 3, 300)) && Array.isArray(p.sections) && p.sections.length > 0 && p.sections.length <= 30 && p.sections.every(s => s && text(s.heading, 2, 180) && Array.isArray(s.paragraphs) && s.paragraphs.length > 0 && s.paragraphs.length <= 30 && s.paragraphs.every(paragraph => text(paragraph, 1, 8000)) && (!s.code || text(s.code, 1, 12000)))
}
export function validWork(value: unknown): value is CmsWork {
  if (!value || typeof value !== 'object') return false
  const w = value as CmsWork
  return text(w.id, 2, 100) && /^[a-zA-Z0-9_-]+$/.test(w.id) && ['web', 'vfx', 'kinetic'].includes(w.branch) && text(w.title, 2, 180) && text(w.summary, 10, 2000) && safeWebsite(w.url) && safeMediaPath(w.cover) && text(w.coverAlt, 3, 300) && ['draft', 'published'].includes(w.status) && Number.isInteger(w.version) && w.version >= 0 && Array.isArray(w.media) && w.media.length <= 50 && w.media.every(m => m && ['image', 'video'].includes(m.type) && safeMediaPath(m.src) && text(m.alt, 3, 300))
}


