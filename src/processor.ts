import type { Section } from './defs'

export function splitReleaseNotesSections(body: string): Section[] {
  const lines = body.split('\r\n')
  const sections: Section[] = [
    {
      title: '',
      items: [],
    },
  ]
  let currentSection: Section = sections[0]!

  for (const line of lines) {
    const trimmedLine = line.trimEnd()
    if (
      trimmedLine.startsWith('## ') ||
      trimmedLine.startsWith('**Thank you')
    ) {
      currentSection = {
        title: trimmedLine.substring(2).trim(),
        items: [],
      }
      sections.push(currentSection)
      continue
    }
    currentSection.items.push(trimmedLine)
  }
  return sections
}

export function filterSections(sections: Section[]): Section[] {
  return sections.filter(
    (s) =>
      s.title.toLowerCase() !== 'desktop' &&
      s.title.toLowerCase().startsWith('thank you') === false,
  )
}
