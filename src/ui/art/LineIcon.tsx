type IconName = 'arrow' | 'email' | 'instagram' | 'linkedin' | 'telegram' | 'youtube' | 'education' | 'certificate' | 'toolkit' | 'experience' | 'language' | 'expand' | 'close'

const paths: Record<IconName, string> = {
  expand: 'M8 3H3v5 M16 3h5v5 M3 16v5h5 M21 16v5h-5',
  close: 'm6 6 12 12 M18 6 6 18',
  arrow: 'M6 18 18 6 M6 6h12v12',
  email: 'M3 5h18v14H3Z M3 6l9 7 9-7',
  instagram: 'M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Z M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0 M17 7h.01',
  linkedin: 'M5 9v11 M5 5v.01 M10 20V9 M10 14c0-7 9-7 9 0v6',
  telegram: 'm3 10 18-7-5 18-5-6-8-5Z M11 15l5-7',
  youtube: 'M6 5h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3Z m4 4 6 3-6 3Z',
  education: 'm2 9 10-5 10 5-10 5-10-5Z M6 11v7l6 3 6-3v-7 M22 9v8',
  certificate: 'M7 3h10v12H7Z M10 7h4 M10 10h4 M9 15l-2 6 5-2 5 2-2-6',
  toolkit: 'M4 6h16v14H4Z M9 6V3h6v3 M4 12h16 M10 12v3h4v-3',
  experience: 'M4 5h16v15H4Z M8 3v4 M16 3v4 M4 10h16 M8 14h3 M8 17h7',
  language: 'M3 4h12 M9 2v2 M5 4c0 5 3 8 8 10 M13 4c0 5-3 8-8 10 M14 21l4-10 4 10 M15 18h6',
}

export default function LineIcon({ name }: { name: IconName }) {
  return <svg className="line-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d={paths[name]} /></svg>
}
