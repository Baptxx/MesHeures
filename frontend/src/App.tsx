import { useState, useEffect } from 'react'
import { Clock, Trash2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useEntries } from '@/hooks/useEntries'
import { useSettings } from '@/hooks/useSettings'
import { useAbsences } from '@/hooks/useAbsences'
import { AuthPage } from '@/components/AuthPage'
import { TodayCard } from '@/components/TodayCard'
import { WeekStats, WeekSummary } from '@/components/WeekStats'
import { BalanceCard } from '@/components/BalanceCard'
import { HistoryPage } from '@/components/HistoryPage'
import { CongesPage } from '@/components/CongesPage'
import { SettingsPage } from '@/components/SettingsPage'
import { EditModal } from '@/components/EditModal'
import { todayStr, addDays } from '@/lib/time'
import { emptyEntry, type AbsenceType, type DayEntry } from '@/lib/types'

type Tab = 'pointage' | 'statistiques' | 'conges' | 'reglages'

const TABS: { key: Tab; label: string }[] = [
  { key: 'pointage', label: 'Pointage' },
  { key: 'statistiques', label: 'Statistiques' },
  { key: 'conges', label: 'Congés' },
  { key: 'reglages', label: 'Réglages' },
]

export default function App() {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')
  const [tab, setTab] = useState<Tab>('pointage')
  const [editDate, setEditDate] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(todayStr())

  const { user, loading: authLoading, login, register, logout } = useAuth()
  const authenticated = !!user

  const { history, entries, loading: entriesLoading, error, saveEntry, deleteEntry, clearLocalEntry } = useEntries(authenticated)
  const { settings, loading: settingsLoading, saveSettings } = useSettings(authenticated)
  const { absences, loading: absencesLoading, saveAbsence, deleteAbsence, clearLocalAbsence } = useAbsences(authenticated)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  const handleSaveEntry = async (entry: DayEntry) => {
    const saved = await saveEntry(entry)
    clearLocalAbsence(entry.date)
    return saved
  }

  const handleSaveAbsence = async (date: string, type: AbsenceType) => {
    await saveAbsence(date, type)
    clearLocalEntry(date)
  }

  if (authLoading) {
    return <FullscreenMessage>Chargement…</FullscreenMessage>
  }

  if (!authenticated) {
    return <AuthPage onLogin={login} onRegister={register} />
  }

  if (entriesLoading || settingsLoading || absencesLoading) {
    return <FullscreenMessage>Chargement…</FullscreenMessage>
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

  const absenceList = Object.values(absences)
  const editEntry = editDate ? entries[editDate] ?? emptyEntry(editDate) : null
  const editAbsence = editDate ? absences[editDate] : undefined
  const selectedEntry = entries[selectedDate] ?? emptyEntry(selectedDate)

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-200">
      <header className="sticky top-0 z-40 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md">
        <div className="max-w-2xl mx-auto px-4">
          <div className="h-14 flex items-center justify-between">
            <div className="w-8" />
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">MesHeures</span>
            </div>
            <button
              onClick={() => setDark(d => !d)}
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition-colors text-xs w-8"
            >
              {dark ? '☀︎' : '☾'}
            </button>
          </div>
          <div className="flex gap-1 -mb-px overflow-x-auto">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  tab === key
                    ? 'border-zinc-900 dark:border-zinc-100 text-zinc-900 dark:text-zinc-100'
                    : 'border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {tab === 'pointage' && (
          <>
            <TodayCard
              entry={selectedEntry}
              absence={absences[selectedDate]}
              goalMinutes={settings.dailyGoalMinutes}
              onSave={handleSaveEntry}
              onSaveAbsence={handleSaveAbsence}
              onPrevDay={() => setSelectedDate(d => addDays(d, -1))}
              onNextDay={() => setSelectedDate(d => addDays(d, 1))}
              onGoToday={() => setSelectedDate(todayStr())}
            />
            <BalanceCard entries={entries} settings={settings} />
            <WeekSummary entries={entries} absences={absences} settings={settings} />
          </>
        )}

        {tab === 'statistiques' && (
          <>
            <WeekStats entries={entries} absences={absences} settings={settings} />

            {(history.length > 0 || absenceList.length > 0) && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Historique</h3>
                  <button
                    onClick={async () => {
                      if (confirm('Supprimer tout l\'historique ?')) {
                        await Promise.all([
                          ...history.map(e => deleteEntry(e.date)),
                          ...absenceList.map(a => deleteAbsence(a.date)),
                        ])
                      }
                    }}
                    className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Tout effacer
                  </button>
                </div>
                <HistoryPage
                  history={history}
                  absences={absenceList}
                  onEdit={date => setEditDate(date)}
                  onDeleteEntry={deleteEntry}
                  onDeleteAbsence={deleteAbsence}
                />
              </div>
            )}
          </>
        )}

        {tab === 'conges' && (
          <CongesPage
            entries={entries}
            absences={absences}
            settings={settings}
            onApply={handleSaveAbsence}
            onClear={deleteAbsence}
          />
        )}

        {tab === 'reglages' && (
          <SettingsPage settings={settings} userEmail={user.email} onSave={saveSettings} onLogout={logout} />
        )}
      </main>

      {editEntry && (
        <EditModal
          entry={editEntry}
          absence={editAbsence}
          onSave={async updated => { await handleSaveEntry(updated) }}
          onSaveAbsence={handleSaveAbsence}
          onClose={() => setEditDate(null)}
        />
      )}
    </div>
  )
}

function FullscreenMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
      <div className="flex items-center gap-3 text-zinc-400">
        <div className="w-4 h-4 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
        <span className="text-sm">{children}</span>
      </div>
    </div>
  )
}
