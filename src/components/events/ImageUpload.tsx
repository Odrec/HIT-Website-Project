'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, Link as LinkIcon, ImageOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { parseVideoUrl } from '@/lib/video-embed'
import Image from 'next/image'

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
}

const VIDEO_LINK_ERROR = 'Das ist ein Video-Link – bitte im Feld „Video“ eintragen.'
const NOT_AN_IMAGE_ERROR =
  'Unter dieser Adresse wurde kein Bild gefunden. Tipp: Rechtsklick auf das Bild → „Bildadresse kopieren“ – oder das Bild speichern und hier hochladen.'

/** Resolves true when the browser can load `url` as an image. */
function loadsAsImage(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new window.Image()
    img.onload = () => resolve(true)
    img.onerror = () => resolve(false)
    img.src = url
  })
}

export function ImageUpload({ value, onChange }: ImageUploadProps) {
  const [busy, setBusy] = useState<'upload' | 'check' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [previewFailed, setPreviewFailed] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const accept = useCallback(
    (url: string) => {
      setPreviewFailed(false)
      onChange(url)
    },
    [onChange]
  )

  const handleUpload = useCallback(
    async (file: File) => {
      setError(null)
      setBusy('upload')
      const formData = new FormData()
      formData.append('file', file)
      try {
        const res = await fetch('/api/upload/image', { method: 'POST', body: formData })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          setError(data.error || 'Upload fehlgeschlagen')
          return
        }
        accept(data.url)
      } catch {
        setError('Upload fehlgeschlagen')
      } finally {
        setBusy(null)
      }
    },
    [accept]
  )

  /** A typed or dragged-in address: only take it if it really is an image. */
  const handleLink = useCallback(
    async (raw: string) => {
      const url = raw.trim()
      if (!url) return
      setError(null)
      if (parseVideoUrl(url)) {
        setError(VIDEO_LINK_ERROR)
        return
      }
      if (!/^https?:\/\//i.test(url)) {
        setError(NOT_AN_IMAGE_ERROR)
        return
      }
      setBusy('check')
      const ok = await loadsAsImage(url)
      setBusy(null)
      if (!ok) {
        setError(NOT_AN_IMAGE_ERROR)
        return
      }
      accept(url)
      setShowUrlInput(false)
      setUrlInput('')
    },
    [accept]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) {
        handleUpload(file)
        return
      }
      // An image dragged from another browser tab arrives as a link, not a file.
      const link =
        e.dataTransfer.getData('text/uri-list').split('\n')[0] ||
        e.dataTransfer.getData('text/plain')
      if (link) handleLink(link)
    },
    [handleUpload, handleLink]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleUpload(file)
    },
    [handleUpload]
  )

  if (value) {
    return (
      <div className="space-y-1.5">
        <Label>Foto</Label>
        <div className="relative inline-block">
          {previewFailed ? (
            <div className="flex h-[150px] w-[200px] flex-col items-center justify-center gap-2 rounded-md border border-dashed border-red-300 bg-red-50 p-3 text-center text-xs text-red-700">
              <ImageOff className="h-6 w-6" />
              Bild kann nicht angezeigt werden – bitte entfernen und neu hochladen.
            </div>
          ) : (
            <Image
              src={value}
              alt="Vorschau"
              width={200}
              height={150}
              className="rounded-md border object-cover"
              unoptimized={value.startsWith('http')}
              onError={() => setPreviewFailed(true)}
            />
          )}
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -right-2 -top-2 h-6 w-6"
            aria-label="Foto entfernen"
            onClick={() => {
              setPreviewFailed(false)
              onChange('')
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <Label>Foto</Label>
      <div
        className={cn(
          'flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors cursor-pointer',
          dragOver
            ? 'border-hit-hs-500 bg-hit-hs-50'
            : 'border-hit-gray-300 hover:border-hit-gray-400',
          busy && 'opacity-50 pointer-events-none'
        )}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="mb-2 h-8 w-8 text-hit-gray-400" />
        <p className="text-sm text-hit-gray-600">
          {busy === 'upload'
            ? 'Wird hochgeladen...'
            : busy === 'check'
              ? 'Bild wird geprüft...'
              : 'Foto hierher ziehen oder klicken'}
        </p>
        <p className="mt-1 text-xs text-hit-gray-400">JPEG, PNG, WebP (max. 5MB)</p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {showUrlInput ? (
        <div className="flex gap-2">
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleLink(urlInput)
              }
            }}
          />
          <Button type="button" size="sm" onClick={() => handleLink(urlInput)}>
            OK
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setShowUrlInput(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-hit-gray-500"
          onClick={() => setShowUrlInput(true)}
        >
          <LinkIcon className="mr-1 h-3 w-3" />
          Oder URL eingeben
        </Button>
      )}
    </div>
  )
}
