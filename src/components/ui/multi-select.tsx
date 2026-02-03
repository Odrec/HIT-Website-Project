'use client'

import * as React from 'react'
import { X, Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'

export interface MultiSelectOption {
  value: string
  label: string
  group?: string
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  disabled?: boolean
  className?: string
  maxDisplay?: number
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Select items...',
  searchPlaceholder = 'Search...',
  emptyText = 'No items found',
  disabled = false,
  className,
  maxDisplay = 3,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')

  const filteredOptions = React.useMemo(() => {
    if (!search) return options
    return options.filter((option) =>
      option.label.toLowerCase().includes(search.toLowerCase())
    )
  }, [options, search])

  const groupedOptions = React.useMemo(() => {
    const groups: Record<string, MultiSelectOption[]> = {}
    filteredOptions.forEach((option) => {
      const group = option.group || 'Other'
      if (!groups[group]) {
        groups[group] = []
      }
      groups[group].push(option)
    })
    return groups
  }, [filteredOptions])

  const selectedOptions = React.useMemo(() => {
    return options.filter((option) => value.includes(option.value))
  }, [options, value])

  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter((v) => v !== optionValue))
    } else {
      onChange([...value, optionValue])
    }
  }

  const removeOption = (optionValue: string, e: React.MouseEvent) => {
    e.stopPropagation()
    onChange(value.filter((v) => v !== optionValue))
  }

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation()
    onChange([])
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div
          role="combobox"
          aria-expanded={isOpen}
          aria-disabled={disabled}
          tabIndex={disabled ? -1 : 0}
          className={cn(
            'flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'hover:bg-accent hover:text-accent-foreground',
            'min-h-10 h-auto',
            disabled && 'cursor-not-allowed opacity-50',
            !value.length && 'text-muted-foreground',
            className
          )}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              if (!disabled) setIsOpen(true)
            }
          }}
        >
          <div className="flex flex-wrap gap-1 flex-1">
            {selectedOptions.length === 0 ? (
              <span>{placeholder}</span>
            ) : selectedOptions.length <= maxDisplay ? (
              selectedOptions.map((option) => (
                <Badge
                  key={option.value}
                  variant="secondary"
                  className="mr-1"
                >
                  {option.label}
                  <span
                    role="button"
                    tabIndex={0}
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    onClick={(e) => removeOption(option.value, e)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        e.stopPropagation()
                        onChange(value.filter((v) => v !== option.value))
                      }
                    }}
                  >
                    <X className="h-3 w-3" />
                  </span>
                </Badge>
              ))
            ) : (
              <Badge variant="secondary">
                {selectedOptions.length} selected
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 ml-2">
            {value.length > 0 && (
              <span
                role="button"
                tabIndex={0}
                className="ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                onMouseDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                }}
                onClick={clearAll}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    e.stopPropagation()
                    onChange([])
                  }
                }}
              >
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </span>
            )}
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <div className="p-2 border-b">
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8"
          />
        </div>
        <div className="max-h-64 overflow-y-auto p-1">
          {filteredOptions.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {emptyText}
            </div>
          ) : (
            Object.entries(groupedOptions).map(([group, groupOptions]) => (
              <div key={group}>
                {Object.keys(groupedOptions).length > 1 && (
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    {group}
                  </div>
                )}
                {groupOptions.map((option) => (
                  <button
                    key={option.value}
                    className={cn(
                      'relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                      value.includes(option.value) && 'bg-accent'
                    )}
                    onClick={() => toggleOption(option.value)}
                  >
                    <div
                      className={cn(
                        'mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary',
                        value.includes(option.value)
                          ? 'bg-primary text-primary-foreground'
                          : 'opacity-50'
                      )}
                    >
                      {value.includes(option.value) && (
                        <Check className="h-3 w-3" />
                      )}
                    </div>
                    {option.label}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
