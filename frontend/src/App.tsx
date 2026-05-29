import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'
import { useEntries } from '@/hooks/useEntries'
import { TodayCard } from '@/components/TodayCard'
import { WeekStats } from '@/components/WeekStats'
import { HistoryPage } from '@/components/HistoryPage'
import { EditModal } from '@/components/EditModal'
import type { DayEntry } from '@/lib/types'

type Tab = 'pointage' | 'historique'

export default function App() {
  const [tab, setTab] = useState<Tab>('pointage')
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
        <div className="max-w-2xl mx-auto px-4">
          {/* Titre + dark mode */}
          <div className="h-12 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">MesHeures</span>
            </div>
            <button
              onClick={() => setDark(d => !d)}
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition-colors text-xs"
            >
              {dark ? '☀︎' : '☾'}
            </button>
          </div>

          {/* Onglets */}
          <div className="flex gap-1 -mb-px">
            {(['pointage', 'historique'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`
                  px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize
                  ${tab === t
                    ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100'
                    : 'border-transparent text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                  }
                `}
              >
                {t === 'pointage' ? 'Pointage' : 'Historique'}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {tab === 'pointage' && (
          <div className="space-y-4">
            <TodayCard entry={todayEntry} onSave={saveEntry} />
            <WeekStats entries={entries} />
          </div>
        )}

        {tab === 'historique' && (
          <HistoryPage
            history={history}
            onEdit={entry => setEditEntry(entry)}
            onDelete={deleteEntry}
          />
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
