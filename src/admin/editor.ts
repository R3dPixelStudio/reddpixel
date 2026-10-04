import type { JournalSection } from '../content/journal'
export const articleText = (sections: JournalSection[]) => sections.map(s => `## ${s.heading}\n\n${s.paragraphs.join('\n\n')}${s.code ? `\n\n\`\`\`\n${s.code}\n\`\`\`` : ''}`).join('\n\n')
export function articleSections(body: string): JournalSection[] {
  const sections: { heading: string; lines: string[] }[] = []
  let fenced = false
  for (const line of body.split('\n')) {
    if (!fenced && line.startsWith('## ')) sections.push({ heading: line.slice(3).trim(), lines: [] })
    else {
      if (!sections.length) { if (!line.trim()) continue; sections.push({ heading: 'Notes from the practice', lines: [] }) }
      sections[sections.length - 1].lines.push(line)
    }
    if (line.startsWith('```')) fenced = !fenced
  }
  return sections.map(section => {
    let prose = section.lines.join('\n').trim()
    const code = prose.match(/```(?:[a-z]+)?\n([\s\S]*?)```/)?.[1]?.trim()
    prose = prose.replace(/```(?:[a-z]+)?\n[\s\S]*?```/, '').trim()
    return { heading: section.heading, paragraphs: prose.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean), ...(code ? { code } : {}) }
  })
}
