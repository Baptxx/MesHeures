import { useState, useEffect } from 'react'
import { Moon, Sun, Clock, Trash2 } from 'lucide-react'
import { useEntries } from '@/hooks/useEntries'
import { TodayCard } from '@/components/TodayCard'
import { WeekStats } from '@/components/WeekStats'
import { HistoryItem } from '@/components/HistoryItem'
import { EditModal } from '@/components/EditModal'
import type { DayEntry } from '@/lib/types'

export default function App() {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')
  const [editEntry, setEditEntry] = useState<DayEntry | null>(null)
  const { todayEntry, history, entries, loading, error, saveEntry, deleteEntry } = useEntries()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-400">
          <div className="w-4 h-4 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
          <span className="text-sm">Chargement…</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-sm font-medium text-red-500">{error}</p>
          <p className="text-xs text-zinc-400">Vérifiez que le serveur tourne sur le port 3000</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-200">
      <header className="sticky top-0 z-40 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">MesHeures</span>
          </div>
          <button
            onClick={() => setDark(d => !d)}
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 transition-colors"
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-4">
        <TodayCard entry={todayEntry} onSave={saveEntry} />

        <WeekStats entries={entries} />

        {history.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Historique</h3>
              <button
                onClick={async () => {
                  if (confirm('Supprimer tout l\'historique ?')) {
                    await Promise.all(history.map(e => deleteEntry(e.date)))
                  }
                }}
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Tout effacer
              </button>
            </div>
            <div className="space-y-2">
              {history.map(entry => (
                <HistoryItem
                  key={entry.date}
                  entry={entry}
                  onEdit={() => setEditEntry(entry)}
                  onDelete={async () => {
                    if (confirm('Supprimer cette entrée ?')) await deleteEntry(entry.date)
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {editEntry && (
        <EditModal
          entry={editEntry}
          onSave={async updated => {
            await saveEntry(updated)
            setEditEntry(null)
          }}
          onClose={() => setEditEntry(null)}
        />
      )}
    </div>
  )
}
