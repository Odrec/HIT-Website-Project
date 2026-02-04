'use client'

import { Button } from '@/components/ui/button'

interface NavigatorSuggestionsProps {
  suggestions: string[]
  onSelect: (suggestion: string) => void
  disabled?: boolean
}

export function NavigatorSuggestions({
  suggestions,
  onSelect,
  disabled = false,
}: NavigatorSuggestionsProps) {
  if (!suggestions || suggestions.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2 py-3">
      {suggestions.map((suggestion, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          onClick={() => onSelect(suggestion)}
          disabled={disabled}
          className="text-sm"
        >
          {suggestion}
        </Button>
      ))}
    </div>
  )
}

export default NavigatorSuggestions
