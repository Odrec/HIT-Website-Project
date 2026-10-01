/**
 * Remove a `## heading` section (up to the next `## ` heading or the end) from
 * a help manual. Used to hide manual sections for switched-off features.
 */
export function removeMarkdownSection(markdown: string, heading: string): string {
  const lines = markdown.split('\n')
  const start = lines.indexOf(`## ${heading}`)
  if (start === -1) return markdown

  const next = lines.findIndex((line, i) => i > start && line.startsWith('## '))
  return [...lines.slice(0, start), ...(next === -1 ? [] : lines.slice(next))].join('\n')
}
