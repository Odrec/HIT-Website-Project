'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, X, Link as LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import Image from 'next/image'

interface ImageUploadProps {
  value: string
  onChange: (url: string) => void
}

export function ImageUpload({ value, onChange }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = useCallback(
    async (file: File) => {
      setError(null)
      setUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      try {
        const res = await fetch('/api/upload/image', { method: 'POST', body: formData })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || 'Upload fehlgeschlagen')
          return
        }
        onChange(data.url)
      } catch {
        setError('Upload fehlgeschlagen')
      } finally {
        setUploading(false)
      }
    },
    [onChange]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (file) handleUpload(file)
    },
    [handleUpload]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleUpload(file)
    },
    [handleUpload]
  )

  const handleUrlSubmit = useCallback(() => {
    if (urlInput.trim()) {
      onChange(urlInput.trim())
      setShowUrlInput(false)
      setUrlInput('')
    }
  }, [urlInput, onChange])

  if (value) {
    return (
      <div className="space-y-1.5">
        <Label>Foto</Label>
        <div className="relative inline-block">
          <Image
            src={value}
            alt="Vorschau"
            width={200}
            height={150}
            className="rounded-md border object-cover"
            unoptimized={value.startsWith('http')}
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -right-2 -top-2 h-6 w-6"
            onClick={() => onChange('')}
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
          uploading && 'opacity-50 pointer-events-none'
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
          {uploading ? 'Wird hochgeladen...' : 'Foto hierher ziehen oder klicken'}
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
            onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
          />
          <Button type="button" size="sm" onClick={handleUrlSubmit}>
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
