interface Props {
  label: string
  value: string
  onChange: (v: string) => void
  icon?: React.ReactNode
}

export function TimeInput({ label, value, onChange, icon }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
        {icon}
        {label}
      </label>
      <input
        type="time"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="
          w-full h-12 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700
          bg-white dark:bg-zinc-800/50
          text-zinc-900 dark:text-zinc-100
          text-sm font-medium
          focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:border-transparent
          transition-all duration-150
          [color-scheme:light] dark:[color-scheme:dark]
          touch-manipulation
        "
      />
    </div>
  )
}
