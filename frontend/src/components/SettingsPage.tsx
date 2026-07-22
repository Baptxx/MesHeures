import { useState, useEffect } from 'react'
import { LogOut, Check, Bell } from 'lucide-react'
import type { Settings } from '@/lib/types'
import { DAY_LETTERS } from '@/lib/time'
import { changePassword, sendTestPush } from '@/lib/api'
import {
  isPushSupported, isIos, isStandalone, enablePushNotifications, disablePushNotifications, getExistingSubscription,
} from '@/lib/push'

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7]
const WEEKDAY_FULL: Record<number, string> = {
  1: 'Lundi', 2: 'Mardi', 3: 'Mercredi', 4: 'Jeudi', 5: 'Vendredi', 6: 'Samedi', 7: 'Dimanche',
}

interface Props {
  settings: Settings
  userEmail: string
  onSave: (settings: Settings) => Promise<Settings>
  onLogout: () => void
}

export function SettingsPage({ settings, userEmail, onSave, onLogout }: Props) {
  const [draft, setDraft] = useState<Settings>(settings)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => setDraft(settings), [settings])

  const toggleDay = (day: number) => {
    setSaved(false)
    setDraft(prev => {
      const has = prev.workDays.includes(day)
      const workDays = has ? prev.workDays.filter(d => d !== day) : [...prev.workDays, day].sort((a, b) => a - b)
      return { ...prev, workDays }
    })
  }

  const handleSave = async () => {
    setError(null)
    if (draft.workDays.length === 0) {
      setError('Sélectionnez au moins un jour travaillé')
      return
    }
    setSaving(true)
    try {
      await onSave(draft)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm p-4 sm:p-6 space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Objectif horaire</h3>
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label="Heures / jour"
              value={draft.dailyGoalMinutes / 60}
              step={0.25}
              min={0.25}
              max={24}
              onChange={h => { setSaved(false); setDraft(prev => ({ ...prev, dailyGoalMinutes: Math.round(h * 60) })) }}
            />
            <NumberField
              label="Solde initial (heures)"
              value={draft.initialBalanceMinutes / 60}
              step={0.25}
              onChange={h => { setSaved(false); setDraft(prev => ({ ...prev, initialBalanceMinutes: Math.round(h * 60) })) }}
            />
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Jours travaillés</h3>
          <div className="flex gap-1.5 flex-wrap">
            {WEEKDAYS.map(day => {
              const active = draft.workDays.includes(day)
              return (
                <button
                  key={day}
                  type="button"
                  title={WEEKDAY_FULL[day]}
                  onClick={() => toggleDay(day)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium border transition-colors ${
                    active
                      ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100'
                      : 'bg-white dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
                  }`}
                >
                  {DAY_LETTERS[day]}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Congés annuels</h3>
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label="Congés payés (jours/an)"
              value={draft.leaveCongePayeAnnualDays}
              step={0.5}
              min={0}
              onChange={v => { setSaved(false); setDraft(prev => ({ ...prev, leaveCongePayeAnnualDays: v })) }}
            />
            <NumberField
              label="RTT (jours/an)"
              value={draft.leaveRttAnnualDays}
              step={0.5}
              min={0}
              onChange={v => { setSaved(false); setDraft(prev => ({ ...prev, leaveRttAnnualDays: v })) }}
            />
          </div>
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 ${
            saved
              ? 'bg-emerald-500 text-white'
              : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-300'
          }`}
        >
          {saved ? <><Check className="w-4 h-4" />Enregistré</> : saving ? 'Sauvegarde…' : 'Enregistrer'}
        </button>
      </div>

      <ReminderSection draft={draft} setDraft={setDraft} setSaved={setSaved} />

      <PasswordSection />

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{userEmail}</p>
            <p className="text-xs text-zinc-400">Connecté</p>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  )
}

interface ReminderSectionProps {
  draft: Settings
  setDraft: React.Dispatch<React.SetStateAction<Settings>>
  setSaved: (saved: boolean) => void
}

function ReminderSection({ draft, setDraft, setSaved }: ReminderSectionProps) {
  const [deviceSubscribed, setDeviceSubscribed] = useState(false)
  const [checkingDevice, setCheckingDevice] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [testError, setTestError] = useState<string | null>(null)
  const supported = isPushSupported()
  const ios = isIos()
  const standalone = isStandalone()

  useEffect(() => {
    if (!supported) { setCheckingDevice(false); return }
    getExistingSubscription()
      .then(sub => setDeviceSubscribed(!!sub))
      .finally(() => setCheckingDevice(false))
  }, [])

  const handleDeviceToggle = async () => {
    setError(null)
    setBusy(true)
    try {
      if (!deviceSubscribed) {
        await enablePushNotifications()
        setDeviceSubscribed(true)
      } else {
        await disablePushNotifications()
        setDeviceSubscribed(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur')
    } finally {
      setBusy(false)
    }
  }

  const handleTest = async () => {
    setTestError(null)
    setTestStatus('sending')
    try {
      await sendTestPush()
      setTestStatus('sent')
      setTimeout(() => setTestStatus('idle'), 3000)
    } catch (err) {
      setTestStatus('error')
      setTestError(err instanceof Error ? err.message : 'Erreur')
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm p-4 sm:p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Bell className="w-4 h-4 text-zinc-400" />
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Rappels de pointage</h3>
      </div>

      {ios && !standalone ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Sur iPhone, les notifications nécessitent d'ajouter MesHeures à l'écran d'accueil : appuie sur{' '}
          <span className="font-medium">Partager</span> puis <span className="font-medium">Sur l'écran d'accueil</span>,
          puis relance l'app depuis l'icône ajoutée pour activer les rappels.
        </p>
      ) : !supported ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Les notifications ne sont pas supportées par ce navigateur.
        </p>
      ) : (
        <>
          <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <p className="text-sm text-zinc-700 dark:text-zinc-300">Notifications sur cet appareil</p>
              <p className="text-xs text-zinc-400">Autorisation nécessaire une fois par appareil</p>
            </div>
            <ToggleSwitch checked={deviceSubscribed} onChange={handleDeviceToggle} disabled={busy || checkingDevice} />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          {deviceSubscribed && (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleTest}
                disabled={testStatus === 'sending'}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-60 ${
                  testStatus === 'sent'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                {testStatus === 'sent' ? 'Envoyé ✓' : testStatus === 'sending' ? 'Envoi…' : 'Tester la notification'}
              </button>
              {testError && <p className="text-xs text-red-500">{testError}</p>}
            </div>
          )}

          {deviceSubscribed && (
            <div className="space-y-3">
              <ReminderRow
                label="Matin"
                hint="si l'arrivée n'est pas pointée"
                enabled={draft.reminderMorningEnabled}
                time={draft.reminderMorningTime}
                onToggle={v => { setSaved(false); setDraft(prev => ({ ...prev, reminderMorningEnabled: v })) }}
                onTimeChange={v => { setSaved(false); setDraft(prev => ({ ...prev, reminderMorningTime: v })) }}
              />
              <ReminderRow
                label="Midi"
                hint="si la pause déjeuner n'est pas complète"
                enabled={draft.reminderNoonEnabled}
                time={draft.reminderNoonTime}
                onToggle={v => { setSaved(false); setDraft(prev => ({ ...prev, reminderNoonEnabled: v })) }}
                onTimeChange={v => { setSaved(false); setDraft(prev => ({ ...prev, reminderNoonTime: v })) }}
              />
              <ReminderRow
                label="Soir"
                hint="si le départ n'est pas pointé"
                enabled={draft.reminderEveningEnabled}
                time={draft.reminderEveningTime}
                onToggle={v => { setSaved(false); setDraft(prev => ({ ...prev, reminderEveningEnabled: v })) }}
                onTimeChange={v => { setSaved(false); setDraft(prev => ({ ...prev, reminderEveningTime: v })) }}
              />
              <p className="text-[11px] text-zinc-400 pt-1">N'oublie pas de cliquer sur Enregistrer ci-dessus pour appliquer ces rappels.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ReminderRow({
  label, hint, enabled, time, onToggle, onTimeChange,
}: {
  label: string
  hint: string
  enabled: boolean
  time: string
  onToggle: (enabled: boolean) => void
  onTimeChange: (time: string) => void
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm text-zinc-700 dark:text-zinc-300">{label}</p>
        <p className="text-xs text-zinc-400 truncate">{hint}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {enabled && (
          <input
            type="time"
            value={time}
            onChange={e => onTimeChange(e.target.value)}
            className="h-9 px-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-sm text-zinc-900 dark:text-zinc-100 [color-scheme:light] dark:[color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
          />
        )}
        <ToggleSwitch checked={enabled} onChange={() => onToggle(!enabled)} />
      </div>
    </div>
  )
}

function ToggleSwitch({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      disabled={disabled}
      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 disabled:opacity-60 ${
        checked ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-700'
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

function PasswordSection() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (next !== confirm) {
      setError('Les mots de passe ne correspondent pas')
      return
    }
    setStatus('saving')
    try {
      await changePassword(current, next)
      setStatus('done')
      setCurrent('')
      setNext('')
      setConfirm('')
      setTimeout(() => setStatus('idle'), 2000)
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Erreur')
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm p-4 sm:p-6">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Changer le mot de passe</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="password"
          placeholder="Mot de passe actuel"
          required
          autoComplete="current-password"
          value={current}
          onChange={e => setCurrent(e.target.value)}
          className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
        />
        <input
          type="password"
          placeholder="Nouveau mot de passe (8 caractères min.)"
          required
          minLength={8}
          autoComplete="new-password"
          value={next}
          onChange={e => setNext(e.target.value)}
          className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
        />
        <input
          type="password"
          placeholder="Confirmer le nouveau mot de passe"
          required
          autoComplete="new-password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          className="w-full h-10 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
        />
        {error && <p className="text-xs text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={status === 'saving'}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60 ${
            status === 'done'
              ? 'bg-emerald-500 text-white'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
          }`}
        >
          {status === 'done' ? 'Mot de passe modifié' : status === 'saving' ? 'Modification…' : 'Modifier'}
        </button>
      </form>
    </div>
  )
}

function NumberField({
  label, value, onChange, step = 1, min, max,
}: { label: string; value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</label>
      <input
        type="number"
        value={value}
        step={step}
        min={min}
        max={max}
        onChange={e => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
        className="w-full h-11 px-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
      />
    </div>
  )
}
