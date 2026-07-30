'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronDown, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export interface MelderOption {
  id: string
  firstName: string | null
  lastName: string | null
  title: string | null
  email: string | null
  phone: string | null
  affiliation: string | null
  organisationseinheit: string | null
  room: string | null
  adresse: string | null
}

interface MelderPickerProps {
  onSelect: (melder: MelderOption) => void
  onReset: () => void
  selectedId: string | null
  disabled?: boolean
}

const fullName = (m: MelderOption) =>
  [m.title, m.firstName, m.lastName].filter(Boolean).join(' ') || (m.email ?? 'Ohne Namen')

export function MelderPicker({ onSelect, onReset, selectedId, disabled }: MelderPickerProps) {
  const [options, setOptions] = useState<MelderOption[]>([])
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/melder/options', { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data: MelderOption[]) => setOptions(data))
      .catch((err: unknown) => {
        if (err instanceof Error && err.name !== 'AbortError') {
          setLoadError('Melder-Liste konnte nicht geladen werden.')
        }
      })
    return () => controller.abort()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return options
    return options.filter((m) =>
      [m.firstName, m.lastName, m.email, m.organisationseinheit]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q))
    )
  }, [options, search])

  const selected = options.find((m) => m.id === selectedId) ?? null

  return (
    <div className="space-y-1.5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              disabled={disabled}
              className="w-full justify-between sm:flex-1"
            >
              <span className={cn('truncate', !selected && 'text-gray-500')}>
                {selected ? fullName(selected) : 'Bestehende Melder*in übernehmen'}
              </span>
              <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[min(28rem,calc(100vw-2rem))] p-0" align="start">
            <div className="border-b p-2">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, E-Mail oder Einrichtung suchen..."
                autoFocus
              />
            </div>
            <ul className="max-h-64 overflow-y-auto py-1" role="listbox">
              {filtered.length === 0 && (
                <li className="px-3 py-2 text-sm text-gray-500">Keine Melder*innen gefunden</li>
              )}
              {filtered.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={m.id === selectedId}
                    onClick={() => {
                      onSelect(m)
                      setOpen(false)
                      setSearch('')
                    }}
                    className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
                  >
                    <Check
                      className={cn(
                        'mt-0.5 h-4 w-4 shrink-0',
                        m.id === selectedId ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{fullName(m)}</span>
                      {m.email && (
                        <span className="block truncate text-xs text-gray-500">{m.email}</span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>
        <Button type="button" variant="ghost" size="sm" onClick={onReset} disabled={disabled}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Neue Melder*in anlegen
        </Button>
      </div>
      {loadError && (
        <p className="text-xs text-red-600" role="alert">
          {loadError}
        </p>
      )}
    </div>
  )
}
