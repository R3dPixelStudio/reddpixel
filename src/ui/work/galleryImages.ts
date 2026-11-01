import { IMAGE_SIZES, thumbnail } from '../../content/imageSizes.ts'

export const VISUAL_IMAGE_SIZES = '(min-width: 768px) calc(100vw - 96px), calc(100vw - 48px)'
export const WEBSITE_IMAGE_SIZES = '(min-width: 1024px) calc(100vw - 340px), (min-width: 768px) calc(100vw - 270px), calc(100vw - 76px)'

export function galleryImage(src: string, sizes = VISUAL_IMAGE_SIZES) {
  const small = thumbnail(src)
  const preview = small !== src && IMAGE_SIZES[small] ? small : undefined
  const dimensions = IMAGE_SIZES[src]
  return {
    src, preview, sizes, width: dimensions?.width, height: dimensions?.height,
    srcSet: preview && dimensions ? `${preview} ${IMAGE_SIZES[preview].width}w, ${src} ${dimensions.width}w` : undefined,
  }
}

// Share small-preview work across collections. Finished entries retain no image element.
const previews = new Map<string, { promise: Promise<void>; ready: boolean; image: HTMLImageElement | null }>()
export function prepareGalleryPreview(src: string, priority: 'low' | 'high' = 'low'): Promise<void> {
  const preview = galleryImage(src).preview
  if (!preview || typeof Image === 'undefined') return Promise.resolve()
  const existing = previews.get(preview)
  if (existing) {
    if (priority === 'high' && existing.image) existing.image.fetchPriority = 'high'
    return existing.promise
  }
  const image = new Image()
  image.decoding = 'async'
  image.fetchPriority = priority
  let resolve!: () => void, reject!: (error: Error) => void
  const promise = new Promise<void>((done, fail) => { resolve = done; reject = fail })
  const entry: { promise: Promise<void>; ready: boolean; image: HTMLImageElement | null } = { promise, ready: false, image }
  previews.set(preview, entry)
  const release = () => { image.onload = null; image.onerror = null; entry.image = null }
  image.onerror = () => {
    release(); previews.delete(preview); reject(new Error('Preview unavailable'))
  }
  image.onload = async () => {
    try {
      if (typeof image.decode === 'function') await image.decode()
      entry.ready = true
      release(); resolve()
      for (const [key, value] of previews) {
        if (previews.size <= 12) break
        if (value.ready) previews.delete(key)
      }
    } catch {
      release(); previews.delete(preview); reject(new Error('Preview unavailable'))
    }
  }
  image.src = preview
  return promise
}

export function allowGalleryWarmup(): boolean {
  if (typeof navigator === 'undefined' || typeof document === 'undefined') return false
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection
  return !document.hidden && !connection?.saveData && !['slow-2g', '2g'].includes(connection?.effectiveType ?? '')
}
