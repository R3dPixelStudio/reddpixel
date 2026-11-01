import { useState } from 'react'
import { galleryImage } from './galleryImages'

export default function GalleryImage({ src, alt, sizes, enabled, current }: { src: string; alt: string; sizes: string; enabled: boolean; current: boolean }) {
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const image = galleryImage(src, sizes)
  const started = enabled || ready || failed
  const reveal = async (element: HTMLImageElement) => {
    const source = element.currentSrc
    try {
      if (typeof element.decode === 'function') await element.decode()
      if (element.isConnected && element.currentSrc === source && element.naturalWidth > 0) { setReady(true); setFailed(false) }
    } catch {
      // Some engines reject decode() for an otherwise loaded image. Keep the load-event fallback.
      if (!element.isConnected || element.currentSrc !== source) return
      if (element.complete && element.naturalWidth > 0) { setReady(true); setFailed(false) }
      else setFailed(true)
    }
  }
  return <>
    {!ready && <span className="gallery-image-placeholder" aria-hidden="true"><span /></span>}
    {started && image.preview && <img className="gallery-image-preview" src={image.preview} width={image.width} height={image.height} alt="" aria-hidden="true" decoding="async" draggable={false} />}
    {started && <img key={attempt} className="gallery-image-full" data-ready={ready && !failed} src={src} srcSet={image.srcSet} sizes={sizes} width={image.width} height={image.height} loading={current ? 'eager' : 'lazy'} fetchPriority={current ? 'high' : 'low'} decoding="async" draggable={false} alt={alt} onLoad={event => { void reveal(event.currentTarget) }} onError={() => setFailed(true)} />}
    {failed && <span className="gallery-image-error" role="status">{image.preview ? 'Sharper image unavailable.' : 'Image unavailable.'}<button type="button" onClick={() => { setFailed(false); setReady(false); setAttempt(value => value + 1) }}>Retry</button></span>}
  </>
}
