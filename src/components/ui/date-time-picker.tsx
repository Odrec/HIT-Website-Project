'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'

interface DateTimePickerProps {
  value?: Date
  onChange: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = 'Select date and time',
  disabled = false,
  className,
}: DateTimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [time, setTime] = React.useState(value ? format(value, 'HH:mm') : '09:00')

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const [hours, minutes] = time.split(':').map(Number)
      const newDate = new Date(date)
      newDate.setHours(hours, minutes, 0, 0)
      onChange(newDate)
    } else {
      onChange(undefined)
    }
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = e.target.value
    setTime(newTime)
    if (value) {
      const [hours, minutes] = newTime.split(':').map(Number)
      const newDate = new Date(value)
      newDate.setHours(hours, minutes, 0, 0)
      onChange(newDate)
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, 'PPP HH:mm') : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={value} onSelect={handleDateSelect} initialFocus />
        <div className="border-t p-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Input type="time" value={time} onChange={handleTimeChange} className="w-auto" />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

interface TimePickerProps {
  value?: string
  onChange: (time: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function TimePicker({
  value = '09:00',
  onChange,
  disabled = false,
  className,
}: TimePickerProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Clock className="h-4 w-4 text-muted-foreground" />
      <Input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-auto"
      />
    </div>
  )
}
