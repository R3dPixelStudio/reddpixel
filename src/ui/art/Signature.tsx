import { GIRIH_PATH } from '../../content/ornament'
export default function Signature({ className = '' }: { className?: string }) {
  return <span className={`signature-object ${className}`} aria-hidden="true"><svg className="girih-orbit" viewBox="0 0 100 100"><path d={GIRIH_PATH} /></svg><span className="signature-space"><span className="signature-cube">{['front', 'back', 'right', 'left', 'top', 'bottom'].map(face => <i key={face} className={`cube-${face}`} />)}</span></span></span>
}
