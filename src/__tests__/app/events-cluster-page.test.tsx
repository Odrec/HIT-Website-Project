import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ClusterProgramsPage from '@/app/(public)/events/cluster/[id]/page'

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    studyProgramCluster: {
      findUnique: vi.fn(),
    },
  },
}))

import { prisma } from '@/lib/db/prisma'

describe('ClusterProgramsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the list of programs in the cluster', async () => {
    ;(prisma.studyProgramCluster.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'c1',
      name: 'Agrar- und Ernährungswissenschaften',
      institution: 'HOCHSCHULE',
      description: null,
      programs: [
        { id: 'p1', name: 'Agrarwissenschaften (B.Sc.)', institution: 'HOCHSCHULE', url: null },
        {
          id: 'p2',
          name: 'Landschaftsarchitektur (B.Eng.)',
          institution: 'HOCHSCHULE',
          url: 'https://hs-os.de/la',
        },
      ],
    })

    const ui = await ClusterProgramsPage({ params: Promise.resolve({ id: 'c1' }) })
    render(ui as React.ReactElement)

    expect(screen.getByText('Agrarwissenschaften (B.Sc.)')).toBeInTheDocument()
    expect(screen.getByText('Landschaftsarchitektur (B.Eng.)')).toBeInTheDocument()
    expect(
      screen.getByText(/Alle Veranstaltungen dieses Studienfelds anzeigen/)
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /Externe Studiengangs-Seite für Landschaftsarchitektur/ })
    ).toBeInTheDocument()
  })

  it('shows a fallback message when no programs are in the cluster', async () => {
    ;(prisma.studyProgramCluster.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 'c2',
      name: 'Leeres Feld',
      institution: 'UNI',
      description: null,
      programs: [],
    })

    const ui = await ClusterProgramsPage({ params: Promise.resolve({ id: 'c2' }) })
    render(ui as React.ReactElement)

    expect(
      screen.getByText('In diesem Studienfeld sind aktuell keine Studiengänge hinterlegt.')
    ).toBeInTheDocument()
  })
})
