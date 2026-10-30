import { NextResponse } from 'next/server'
import React from 'react'
import ReactPDF, { type TextProps } from '@react-pdf/renderer'
import { readFileSync } from 'fs'
import path from 'path'
import { auth } from '@/auth'
import { exportService, formatEventType } from '@/services/export-service'
import { formatEventTime } from '@/lib/event-time'
import { compareDe } from '@/lib/sort-de'

const { Document, Page, Text, View, StyleSheet, Image: PDFImage } = ReactPDF

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BURGUNDY = '#AC0634'
const CYAN = '#009EE3'
const DARK_GRAY = '#444444'
const GRAY = '#666666'
const LIGHT_GRAY = '#999999'
const CLUSTER_BG = '#F0F0F0'
const BORDER_COLOR = '#E0E0E0'

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 50,
    paddingHorizontal: 40,
    fontSize: 9,
    fontFamily: 'Helvetica',
  },
  // Cover page
  coverContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    gap: 24,
  },
  logoUni: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: BURGUNDY,
  },
  logoHS: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: CYAN,
  },
  logoZSB: {
    fontSize: 11,
    color: DARK_GRAY,
  },
  coverTitle: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 12,
  },
  coverSubtitle: {
    fontSize: 18,
    color: GRAY,
    marginBottom: 8,
  },
  coverDate: {
    fontSize: 16,
    marginBottom: 40,
  },
  coverFooter: {
    fontSize: 10,
    color: GRAY,
  },
  // Page footer
  pageFooter: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: GRAY,
  },
  // Cluster header
  clusterHeader: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 14,
    backgroundColor: CLUSTER_BG,
    padding: 6,
  },
  // Two-column layout
  columnsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  column: {
    flex: 1,
  },
  // Event entry
  eventEntry: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER_COLOR,
  },
  eventTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    marginBottom: 2,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 2,
  },
  badgeInstitutionUni: {
    backgroundColor: BURGUNDY,
    color: 'white',
    fontSize: 7,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
  },
  badgeInstitutionHS: {
    backgroundColor: CYAN,
    color: 'white',
    fontSize: 7,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
  },
  badgeInstitutionBoth: {
    backgroundColor: GRAY,
    color: 'white',
    fontSize: 7,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
  },
  badgeType: {
    backgroundColor: CLUSTER_BG,
    color: DARK_GRAY,
    fontSize: 7,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
  },
  eventDetails: {
    fontSize: 8,
    color: GRAY,
    marginBottom: 1,
  },
  eventPrograms: {
    fontSize: 8,
    color: GRAY,
    marginBottom: 1,
  },
  eventDescription: {
    fontSize: 8,
    color: LIGHT_GRAY,
  },
  // Section headers (cross-program, info markets, links)
  sectionHeader: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 14,
    backgroundColor: CLUSTER_BG,
    padding: 6,
    marginBottom: 8,
    marginTop: 16,
  },
  // Headings inside a section (Schulform, Infomarkt) and below them (Fachrichtung)
  subsectionHeader: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER_COLOR,
    paddingBottom: 2,
    marginTop: 10,
    marginBottom: 6,
  },
  programHeader: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    backgroundColor: CLUSTER_BG,
    paddingVertical: 2,
    paddingHorizontal: 4,
    marginTop: 6,
    marginBottom: 6,
  },
  infoMarketLocation: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    color: GRAY,
    marginBottom: 6,
  },
  emptyHint: {
    fontSize: 9,
    color: GRAY,
    marginBottom: 8,
  },
  linkText: {
    fontSize: 10,
    color: CYAN,
    marginBottom: 4,
  },
  tocHeading: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 18,
    marginBottom: 16,
  },
  tocSectionLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    marginTop: 10,
    marginBottom: 4,
  },
  tocItem: {
    fontSize: 10,
    color: DARK_GRAY,
    marginLeft: 12,
    marginBottom: 2,
  },
  tocRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 2,
  },
  tocRowLeader: {
    flex: 1,
    borderBottomWidth: 0.5,
    borderBottomColor: LIGHT_GRAY,
    borderBottomStyle: 'dotted',
    marginHorizontal: 4,
    marginBottom: 2,
  },
  tocPageNumber: {
    fontSize: 10,
    color: DARK_GRAY,
  },
  institutionLabel: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    color: GRAY,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const h = React.createElement

function formatTime(date: Date | null): string {
  if (!date) return ''
  return formatEventTime(date)
}

function formatInstitutionLabel(institution: string): string {
  switch (institution) {
    case 'UNI':
      return 'Universität'
    case 'HOCHSCHULE':
      return 'Hochschule'
    case 'BOTH':
      return 'Hochschulübergreifend'
    default:
      return String(institution)
  }
}

function getInstitutionBadgeStyle(institution: string) {
  switch (institution) {
    case 'UNI':
      return styles.badgeInstitutionUni
    case 'HOCHSCHULE':
      return styles.badgeInstitutionHS
    default:
      return styles.badgeInstitutionBoth
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderEventEntry(event: any) {
  const timeStart = formatTime(event.timeStart)
  const timeEnd = formatTime(event.timeEnd)
  const timeStr = timeEnd ? `${timeStart} \u2013 ${timeEnd}` : timeStart
  const building = event.building?.name ?? event.room?.building?.name ?? ''
  const room = event.room?.name ?? ''
  const lecturers = event.lecturers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((l: any) => [l.title, l.firstName, l.lastName].filter(Boolean).join(' '))
    .join(', ')
  const detailParts = [timeStr, [building, room].filter(Boolean).join(', '), lecturers].filter(
    Boolean
  )
  const detailsLine = detailParts.join(' | ')

  const programs = event.studyPrograms
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((esp: any) => esp.studyProgram.name)
    .sort(compareDe)
    .join(', ')

  const description = event.description
    ? event.description.length > 200
      ? event.description.slice(0, 200) + '\u2026'
      : event.description
    : ''

  return h(
    View,
    { style: styles.eventEntry, key: event.id },
    h(Text, { style: styles.eventTitle }, event.title),
    h(
      View,
      { style: styles.badgesRow },
      h(
        Text,
        { style: getInstitutionBadgeStyle(event.institution) },
        formatInstitutionLabel(event.institution)
      ),
      h(Text, { style: styles.badgeType }, formatEventType(event.eventType))
    ),
    detailsLine ? h(Text, { style: styles.eventDetails }, detailsLine) : null,
    programs ? h(Text, { style: styles.eventPrograms }, programs) : null,
    description ? h(Text, { style: styles.eventDescription }, description) : null
  )
}

function institutionLabel(institution: string): string {
  switch (institution) {
    case 'HOCHSCHULE':
      return 'Hochschule'
    case 'UNI':
      return 'Universität'
    case 'BOTH':
      return 'Hochschulübergreifend'
    default:
      return String(institution)
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderTwoColumnEvents(events: any[]) {
  const leftEvents = events.filter((_, i) => i % 2 === 0)
  const rightEvents = events.filter((_, i) => i % 2 === 1)
  return h(
    View,
    { style: styles.columnsContainer },
    h(View, { style: styles.column }, ...leftEvents.map(renderEventEntry)),
    h(View, { style: styles.column }, ...rightEvents.map(renderEventEntry))
  )
}

/**
 * Keeps a heading (and its TOC marker) on the page where the content after it
 * starts, instead of leaving it alone at the bottom of the previous page.
 */
function keepWithNext(key: string, ...children: React.ReactElement[]) {
  return h(View, { key, wrap: false, minPresenceAhead: 60 }, ...children)
}

function pageFooter() {
  return h(Text, {
    style: styles.pageFooter,
    render: ({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) =>
      `Seite ${pageNumber} / ${totalPages}`,
    fixed: true,
  })
}

/**
 * Invisible marker whose render callback reports the page number this
 * element landed on. Used in pass 1 to learn each section's start page;
 * kept in pass 2 (callback absent) so both passes lay out identically.
 */
function pageMarker(key: string, collect?: (key: string, page: number) => void) {
  return h(Text, {
    key: `marker-${key}`,
    style: { fontSize: 0.1 },
    render: ({ pageNumber }: { pageNumber: number }) => {
      collect?.(key, pageNumber)
      return ''
    },
  })
}

/** One TOC line: title, dotted leader, page number (blank in pass 1). */
function tocRow(
  key: string,
  title: string,
  style: TextProps['style'],
  tocPages: Record<string, number> | null
) {
  const page = tocPages?.[key]
  return h(
    View,
    { style: styles.tocRow, key: `toc-${key}` },
    h(Text, { style }, title),
    h(View, { style: styles.tocRowLeader }),
    h(Text, { style: styles.tocPageNumber }, page ? String(page) : '')
  )
}

// ---------------------------------------------------------------------------
// Document assembly
// ---------------------------------------------------------------------------

function buildDoc(
  data: Awaited<ReturnType<typeof exportService.eventsForBooklet>>,
  logos: { uos: string; hs: string },
  tocPages: Record<string, number> | null,
  collect?: (key: string, page: number) => void
): React.ReactElement {
  const { clusterGroups, crossProgram, lehramt, infoMarkets } = data
  const hasLehramt = lehramt.schulformen.length > 0 || lehramt.fachrichtungen.length > 0

  // Group cluster groups into institution sections, preserving order.
  const sections: { label: string; groups: typeof clusterGroups }[] = []
  for (const g of clusterGroups) {
    const label = institutionLabel(g.institution)
    let section = sections.find((s) => s.label === label)
    if (!section) {
      section = { label, groups: [] }
      sections.push(section)
    }
    section.groups.push(g)
  }

  const contentPages: React.ReactElement[] = []

  // --- Table of contents ---
  const tocChildren: React.ReactElement[] = [
    h(Text, { style: styles.tocHeading, key: 'toc-h' }, 'Inhaltsverzeichnis'),
  ]
  if (crossProgram.length > 0) {
    tocChildren.push(
      tocRow('rund-ums-studium', 'Rund ums Studium', styles.tocSectionLabel, tocPages)
    )
  }
  for (const section of sections) {
    tocChildren.push(
      h(Text, { style: styles.tocSectionLabel, key: `toc-sec-${section.label}` }, section.label)
    )
    for (const g of section.groups) {
      tocChildren.push(
        tocRow(`cluster-${section.label}-${g.name}`, g.name, styles.tocItem, tocPages)
      )
    }
  }
  if (hasLehramt) {
    tocChildren.push(h(Text, { style: styles.tocSectionLabel, key: 'toc-sec-lehramt' }, 'Lehramt'))
    for (const g of lehramt.schulformen) {
      tocChildren.push(tocRow(`lehramt-${g.title}`, g.title, styles.tocItem, tocPages))
    }
    if (lehramt.fachrichtungen.length > 0) {
      tocChildren.push(
        tocRow('lehramt-fachrichtungen', 'Berufliche Fachrichtungen', styles.tocItem, tocPages)
      )
    }
  }
  if (infoMarkets.length > 0) {
    tocChildren.push(
      h(Text, { style: styles.tocSectionLabel, key: 'toc-sec-infomaerkte' }, 'Infomärkte')
    )
    for (const m of infoMarkets) {
      tocChildren.push(tocRow(`infomarkt-${m.id}`, m.name, styles.tocItem, tocPages))
    }
  }
  tocChildren.push(tocRow('links', 'Nützliche Links', styles.tocSectionLabel, tocPages))

  contentPages.push(
    h(
      Page,
      { size: 'A4', style: styles.page, key: 'toc', bookmark: 'Inhaltsverzeichnis' },
      ...tocChildren,
      pageFooter()
    )
  )

  // --- Rund ums Studium (cross-program) ---
  if (crossProgram.length > 0) {
    contentPages.push(
      h(
        Page,
        { size: 'A4', style: styles.page, key: 'rund-ums-studium', bookmark: 'Rund ums Studium' },
        pageMarker('rund-ums-studium', collect),
        h(Text, { style: styles.sectionHeader }, 'Rund ums Studium'),
        renderTwoColumnEvents(crossProgram),
        pageFooter()
      )
    )
  }

  // --- Institution sections → Studienfeld pages ---
  for (const section of sections) {
    for (const g of section.groups) {
      contentPages.push(
        h(
          Page,
          {
            size: 'A4',
            style: styles.page,
            key: `cluster-${section.label}-${g.name}`,
            bookmark: `${section.label}: ${g.name}`,
          },
          pageMarker(`cluster-${section.label}-${g.name}`, collect),
          h(Text, { style: styles.institutionLabel }, section.label),
          h(Text, { style: styles.clusterHeader }, g.name),
          renderTwoColumnEvents(g.events),
          pageFooter()
        )
      )
    }
  }

  // --- Lehramt: replaces the two Lehramt Studienfelder. First the events per
  // Schulform (as on /events/lehramt), then per berufliche Fachrichtung. ---
  if (hasLehramt) {
    const fachrichtungen =
      lehramt.fachrichtungen.length > 0
        ? [
            keepWithNext(
              'lehramt-fachrichtungen',
              pageMarker('lehramt-fachrichtungen', collect),
              h(Text, { style: styles.subsectionHeader }, 'Berufliche Fachrichtungen')
            ),
            ...lehramt.fachrichtungen.map((g) =>
              h(
                View,
                { key: `fachrichtung-${g.title}` },
                keepWithNext('heading', h(Text, { style: styles.programHeader }, g.title)),
                renderTwoColumnEvents(g.events)
              )
            ),
          ]
        : []
    contentPages.push(
      h(
        Page,
        { size: 'A4', style: styles.page, key: 'lehramt', bookmark: 'Lehramt' },
        h(Text, { style: styles.sectionHeader }, 'Lehramt'),
        ...lehramt.schulformen.map((g) =>
          h(
            View,
            { key: `schulform-${g.title}` },
            keepWithNext(
              'heading',
              pageMarker(`lehramt-${g.title}`, collect),
              h(Text, { style: styles.subsectionHeader }, g.title)
            ),
            renderTwoColumnEvents(g.events)
          )
        ),
        ...fachrichtungen,
        pageFooter()
      )
    )
  }

  // --- Info markets, each with its stands ---
  if (infoMarkets.length > 0) {
    contentPages.push(
      h(
        Page,
        { size: 'A4', style: styles.page, key: 'info-markets', bookmark: 'Infomärkte' },
        h(Text, { style: styles.sectionHeader }, 'Infomärkte'),
        ...infoMarkets.map((market) =>
          h(
            View,
            { key: market.id },
            keepWithNext(
              'heading',
              pageMarker(`infomarkt-${market.id}`, collect),
              h(Text, { style: styles.subsectionHeader }, market.name),
              h(Text, { style: styles.infoMarketLocation }, market.location)
            ),
            market.events.length > 0
              ? renderTwoColumnEvents(market.events)
              : h(
                  Text,
                  { style: styles.emptyHint },
                  'Noch keine Infomarkt-Veranstaltungen an diesem Standort.'
                )
          )
        ),
        pageFooter()
      )
    )
  }

  // --- Links ---
  contentPages.push(
    h(
      Page,
      { size: 'A4', style: styles.page, key: 'links', bookmark: 'Nützliche Links' },
      pageMarker('links', collect),
      h(Text, { style: styles.sectionHeader }, 'Nützliche Links'),
      h(Text, { style: styles.linkText }, 'www.zsb-os.de'),
      h(Text, { style: styles.linkText }, 'www.uni-osnabrueck.de'),
      h(Text, { style: styles.linkText }, 'www.hs-osnabrueck.de'),
      pageFooter()
    )
  )

  // -- Assemble document --

  return h(
    Document,
    null,
    // Cover page
    h(
      Page,
      { size: 'A4', style: styles.page, key: 'cover' },
      h(
        View,
        { style: styles.coverContainer },
        h(
          View,
          { style: styles.logoRow },
          h(PDFImage, { src: logos.uos, style: { height: 30 } }),
          h(PDFImage, { src: logos.hs, style: { height: 30 } }),
          h(Text, { style: styles.logoZSB }, 'Zentrale Studienberatung')
        ),
        h(Text, { style: styles.coverTitle }, 'Hochschulinfotag'),
        h(Text, { style: styles.coverSubtitle }, 'Programm'),
        h(Text, { style: styles.coverDate }, '19. November 2026'),
        h(Text, { style: styles.coverFooter }, 'www.zsb-os.de')
      ),
      pageFooter()
    ),
    // Content pages
    ...contentPages
  )
}

// ---------------------------------------------------------------------------
// GET handler
// ---------------------------------------------------------------------------

export async function GET() {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 })
    }

    const uosLogoPath = path.join(process.cwd(), 'public/logos/uos-logo.svg')
    const hsLogoPath = path.join(process.cwd(), 'public/logos/hs-logo.svg')
    const uosLogoBase64 = `data:image/svg+xml;base64,${readFileSync(uosLogoPath).toString('base64')}`
    const hsLogoBase64 = `data:image/svg+xml;base64,${readFileSync(hsLogoPath).toString('base64')}`

    const data = await exportService.eventsForBooklet()
    const logos = { uos: uosLogoBase64, hs: hsLogoBase64 }

    // Pass 1: discover which page each section starts on. Last write wins:
    // while it splits a Page, react-pdf calls the render callbacks of all
    // content not yet placed with the number of the page being split, so a
    // marker further down first reports too early a page. Only the final
    // call, made after pagination, has the page the marker landed on.
    const sectionPages: Record<string, number> = {}
    const collect = (key: string, page: number) => {
      sectionPages[key] = page
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const passOneStream = await ReactPDF.renderToStream(buildDoc(data, logos, null, collect) as any)
    for await (const _chunk of passOneStream) {
      // drain \u2014 pass 1 output is discarded
    }

    // Pass 2: same document with the discovered page numbers in the TOC.
    // TOC rows have identical height with and without numbers, so
    // pagination does not shift between passes.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfStream = await ReactPDF.renderToStream(buildDoc(data, logos, sectionPages) as any)
    const chunks: Uint8Array[] = []
    for await (const chunk of pdfStream) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
    }
    const buffer = Buffer.concat(chunks)

    const today = new Date().toISOString().slice(0, 10)

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="hit-programm-${today}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error generating PDF booklet:', error)
    return NextResponse.json({ error: 'Failed to generate PDF booklet' }, { status: 500 })
  }
}
