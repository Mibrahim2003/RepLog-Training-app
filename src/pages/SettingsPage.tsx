import { useEffect, useState } from 'react'
import { AppShell } from '../components'
import { useAppContext } from '../context/AppContext'

function formatTimeAgo(date: Date, now: Date) {
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (seconds < 5) return 'Saved just now'
  if (seconds < 60) return `Saved ${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `Saved ${minutes}m ago`
  return `Saved at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}

export function SettingsPage() {
  const { profile, updateProfile, signOut } = useAppContext()
  
  const [draftName, setDraftName] = useState(profile.displayName)
  const [draftUnit, setDraftUnit] = useState(profile.preferredUnit)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [now, setNow] = useState(new Date())

  // Sync draft if profile changes externally (like on initial load)
  useEffect(() => {
    setDraftName(profile.displayName)
    setDraftUnit(profile.preferredUnit)
  }, [profile.displayName, profile.preferredUnit])

  // Timer to update the "Saved Xs ago" text
  useEffect(() => {
    if (!lastSaved) return
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [lastSaved])

  const isDirty = draftName !== profile.displayName || draftUnit !== profile.preferredUnit

  const handleSave = async () => {
    setIsSaving(true)
    await updateProfile({ displayName: draftName, preferredUnit: draftUnit })
    setIsSaving(false)
    setLastSaved(new Date())
    setNow(new Date())
  }

  return (
    <AppShell activeTab="settings">
      <section className="page-stack">
        <div className="section-heading">
          <h1>Settings</h1>
        </div>

        <section className="settings-card brutal-card">
          <div className="setup-field-row">
            <span className="field-label">Preferred Unit</span>
            <div className="segmented-control">
              {(['kg', 'lb'] as const).map((unit) => (
                <button
                  key={unit}
                  type="button"
                  className={`segment${draftUnit === unit ? ' segment--active' : ''}`}
                  onClick={() => setDraftUnit(unit)}
                >
                  {unit.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="setup-field-row">
            <label className="field-label" htmlFor="display-name">
              Display Name
            </label>
            <input
              id="display-name"
              className="brutal-input"
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
            />
          </div>

          <div className="notice-box">
            Switching units converts the display of all historical weights without changing stored
            values.
          </div>

          <div className="settings-actions">
            <button
              type="button"
              className="brutal-button brutal-button--primary"
              disabled={!isDirty || isSaving}
              onClick={() => void handleSave()}
            >
              {isSaving ? 'Saving…' : 'Save Changes'}
            </button>
            {lastSaved && !isDirty ? (
              <>
                <span className="saved-timestamp" aria-hidden="true">
                  {formatTimeAgo(lastSaved, now)}
                </span>
                <span className="sr-only" role="status" aria-live="polite">
                  Settings saved successfully.
                </span>
              </>
            ) : null}
          </div>

          <hr className="settings-divider" />

          <button
            type="button"
            className="brutal-button brutal-button--secondary brutal-button--full"
            onClick={() => {
              void signOut()
            }}
          >
            Sign Out
          </button>
        </section>
      </section>
    </AppShell>
  )
}

