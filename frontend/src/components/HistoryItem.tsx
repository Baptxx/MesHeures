import { Pencil, Trash2, Sunrise, Coffee, Sun, Sunset } from 'lucide-react'
import type { DayEntry } from '@/lib/types'
import { calcDurations, isComplete, isStarted, formatDate, formatDateShort, fromMinutes } from '@/lib/time'
import { Badge } from './Badge'

interface Props {
  entry: DayEntry
  onEdit: () => void
  onDelete: () => void
}

export function HistoryItem({ entry, onEdit, onDelete }: Props) {
  const { total } = calcDurations(entry)
  const variant = isComplete(entry) ? 'complete' : isStarted(entry) ? 'partial' : 'empty'

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-200 dark:hover:border-zinc-700 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 capitalize">
            {formatDate(entry.date)}
          </span>
          <Badge variant={variant} />
        </div>
        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-400 dark:text-zinc-500">
          <span className="tabular-nums">{formatDateShort(entry.date)}</span>
          <span className="hidden sm:inline text-zinc-200 dark:text-zinc-700">·</span>
          <TimeChip icon={<Sunrise className="w-3 h-3" />} value={entry.arrivee} />
          <TimeChip icon={<Coffee className="w-3 h-3" />} value={entry.departMidi} />
          <TimeChip icon={<Sun className="w-3 h-3" />} value={entry.ariveeMidi} />
          <TimeChip icon={<Sunset className="w-3 h-3" />} value={entry.departSoir} />
        </div>
      </div>

      {total !== null && (
        <span className="text-sm font-semibold tabular-nums text-zinc-700 dark:text-zinc-300 shrink-0">
          {fromMinutes(total)}
        </span>
      )}

      {/* Toujours visible sur mobile, hover sur desktop */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onEdit}
          className="p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors touch-manipulation"
          aria-label="Modifier"
        >
          <Pencil className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-950 text-zinc-400 hover:text-red-500 transition-colors touch-manipulation"
          aria-label="Supprimer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function TimeChip({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <span className="flex items-center gap-1">
      {icon}
      {value || '—'}
    </span>
  )
}
