'use client'

import { Button } from '@/components/ui/button'
import type { NavigatorOption } from '@/types/navigator'

interface NavigatorSuggestionsProps {
  options: NavigatorOption[]
  onSelect: (label: string) => void
  disabled?: boolean
}

export function NavigatorSuggestions({
  options,
  onSelect,
  disabled = false,
}: NavigatorSuggestionsProps) {
  if (!options || options.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 py-3">
      {options.map((opt, index) => (
        <Button
          key={`${index}-${opt.label}`}
          variant="outline"
          size="sm"
          onClick={() => onSelect(opt.label)}
          disabled={disabled}
          className="h-auto min-h-9 flex-col items-start gap-0 whitespace-normal py-1.5 text-left text-sm"
          title={opt.description}
        >
          <span>{opt.label}</span>
          {opt.description && (
            <span className="text-xs font-normal text-muted-foreground">{opt.description}</span>
          )}
        </Button>
      ))}
    </div>
  )
}

export default NavigatorSuggestions
