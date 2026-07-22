import { useState, useEffect, useCallback } from 'react'
import type { Settings } from '@/lib/types'
import { fetchSettings, saveSettings as apiSaveSettings } from '@/lib/api'

const DEFAULT_SETTINGS: Settings = {
  dailyGoalMinutes: 420,
  workDays: [1, 2, 3, 4, 5],
  initialBalanceMinutes: 0,
  leaveCongePayeAnnualDays: 25,
  leaveRttAnnualDays: 0,
  reminderMorningEnabled: false,
  reminderMorningTime: '09:00',
  reminderNoonEnabled: false,
  reminderNoonTime: '12:30',
  reminderEveningEnabled: false,
  reminderEveningTime: '18:00',
}

export function useSettings(enabled: boolean) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!enabled) return
    setLoading(true)
    fetchSettings()
      .then(setSettings)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [enabled])

  const saveSettings = useCallback(async (next: Settings) => {
    const saved = await apiSaveSettings(next)
    setSettings(saved)
    return saved
  }, [])

  return { settings, loading, saveSettings }
}
