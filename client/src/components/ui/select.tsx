import * as React from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: Array<{ value: string; label: string }>
  placeholder?: string
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, placeholder, value, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          className={cn(
            'w-full appearance-none border border-[var(--border-soft)] bg-transparent px-3 py-2 pr-8 text-sm text-[var(--text-main)] outline-none transition-colors focus:border-[var(--accent)] disabled:opacity-40',
            !value && placeholder && 'text-[var(--text-soft)]',
            className,
          )}
          ref={ref}
          value={value}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
      </div>
    )
  },
)
Select.displayName = 'Select'

export { Select }
