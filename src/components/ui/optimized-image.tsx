'use client'

/**
 * Optimized Image Component
 * 
 * Provides lazy loading, blur placeholder, and responsive sizing
 * for better performance and Core Web Vitals.
 */

import Image, { ImageProps } from 'next/image'
import { useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  /** Enable blur-up placeholder effect */
  blurPlaceholder?: boolean
  /** Fallback image URL if main image fails to load */
  fallbackSrc?: string
  /** Additional class for wrapper div */
  wrapperClassName?: string
  /** Aspect ratio (e.g., "16/9", "4/3", "1/1") */
  aspectRatio?: string
  /** Enable fade-in animation on load */
  fadeIn?: boolean
}

/**
 * Default blur placeholder data URL (gray)
 */
const DEFAULT_BLUR_DATA_URL = 
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIGZpbGw9IiNFNUU3RUIiLz48L3N2Zz4='

/**
 * Placeholder SVG for missing/error images
 */
const PLACEHOLDER_IMAGE = 
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiNGM0Y0RjYiLz48cGF0aCBkPSJNMTgxLjMxNCAxMzFIMjE4LjY4NkMyMjMuMTA0IDEzMSAyMjYuNjg2IDEzNC41ODIgMjI2LjY4NiAxMzlWMTYxQzIyNi42ODYgMTY1LjQxOCAyMjMuMTA0IDE2OSAyMTguNjg2IDE2OUgxODEuMzE0QzE3Ni44OTYgMTY5IDE3My4zMTQgMTY1LjQxOCAxNzMuMzE0IDE2MVYxMzlDMTczLjMxNCAxMzQuNTgyIDE3Ni44OTYgMTMxIDE4MS4zMTQgMTMxWiIgc3Ryb2tlPSIjOUI5QjlCIiBzdHJva2Utd2lkdGg9IjIiLz48Y2lyY2xlIGN4PSIxODciIGN5PSIxNDIiIHI9IjUiIGZpbGw9IiM5QjlCOUIiLz48cGF0aCBkPSJNMTczLjMxNCAxNjNMMTg0LjA2OSAxNTIuMjQ1QzE4NS4yNDEgMTUxLjA3MyAxODcuMTA5IDE1MS4wNzMgMTg4LjI4MSAxNTIuMjQ1TDE5OS4wMzYgMTYzIiBzdHJva2U9IiM5QjlCOUIiIHN0cm9rZS13aWR0aD0iMiIvPjxwYXRoIGQ9Ik0xOTcuNDk1IDE1OC45OTVMMjA1LjEyMSAxNTEuMzY5QzIwNi4yOTMgMTUwLjE5NyAyMDguMTYxIDE1MC4xOTcgMjA5LjMzMyAxNTEuMzY5TDIyNi42ODYgMTY4Ljc0NCIgc3Ryb2tlPSIjOUI5QjlCIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4='

export function OptimizedImage({
  src,
  alt,
  blurPlaceholder = true,
  fallbackSrc,
  wrapperClassName,
  aspectRatio,
  fadeIn = true,
  className,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const imageRef = useRef<HTMLDivElement>(null)

  // Intersection Observer for lazy loading trigger
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.disconnect()
          }
        })
      },
      {
        rootMargin: '50px', // Start loading 50px before viewport
        threshold: 0.01,
      }
    )

    if (imageRef.current) {
      observer.observe(imageRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const handleLoad = useCallback(() => {
    setIsLoaded(true)
  }, [])

  const handleError = useCallback(() => {
    setHasError(true)
  }, [])

  // Determine the image source
  const imageSrc = hasError 
    ? (fallbackSrc || PLACEHOLDER_IMAGE)
    : src

  // Calculate aspect ratio style
  const aspectRatioStyle = aspectRatio 
    ? { aspectRatio } 
    : undefined

  return (
    <div 
      ref={imageRef}
      className={cn(
        'relative overflow-hidden bg-gray-100',
        wrapperClassName
      )}
      style={aspectRatioStyle}
    >
      {isInView && (
        <Image
          src={imageSrc}
          alt={alt}
          className={cn(
            'object-cover',
            fadeIn && 'transition-opacity duration-300',
            fadeIn && !isLoaded && 'opacity-0',
            fadeIn && isLoaded && 'opacity-100',
            className
          )}
          placeholder={blurPlaceholder ? 'blur' : 'empty'}
          blurDataURL={blurPlaceholder ? DEFAULT_BLUR_DATA_URL : undefined}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}
      
      {/* Loading skeleton */}
      {!isLoaded && isInView && !hasError && (
        <div 
          className="absolute inset-0 animate-pulse bg-gray-200"
          aria-hidden="true"
        />
      )}
    </div>
  )
}

/**
 * Event photo component optimized for event cards
 */
export function EventPhoto({
  src,
  alt,
  className,
  ...props
}: Omit<OptimizedImageProps, 'fill' | 'sizes' | 'aspectRatio'>) {
  return (
    <OptimizedImage
      src={src || PLACEHOLDER_IMAGE}
      alt={alt}
      aspectRatio="16/9"
      fill
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      className={cn('object-cover', className)}
      {...props}
    />
  )
}

/**
 * Avatar image component
 */
export function AvatarImage({
  src,
  alt,
  size = 40,
  className,
  ...props
}: Omit<OptimizedImageProps, 'width' | 'height'> & { size?: number }) {
  return (
    <OptimizedImage
      src={src || PLACEHOLDER_IMAGE}
      alt={alt}
      width={size}
      height={size}
      aspectRatio="1/1"
      className={cn('rounded-full', className)}
      {...props}
    />
  )
}

/**
 * Thumbnail image component with fixed dimensions
 */
export function ThumbnailImage({
  src,
  alt,
  width = 150,
  height = 100,
  className,
  ...props
}: Omit<OptimizedImageProps, 'fill'>) {
  return (
    <OptimizedImage
      src={src || PLACEHOLDER_IMAGE}
      alt={alt}
      width={width}
      height={height}
      className={cn('rounded', className)}
      {...props}
    />
  )
}

export default OptimizedImage
