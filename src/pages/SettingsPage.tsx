import { AppShell } from '../components'
import { useAppContext } from '../context/AppContext'

export function SettingsPage() {
  const { profile, updateProfile, signOut } = useAppContext()

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
                  className={`segment${profile.preferredUnit === unit ? ' segment--active' : ''}`}
                  onClick={() => {
                    void updateProfile({ preferredUnit: unit })
                  }}
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
              value={profile.displayName}
              onChange={(event) => {
                void updateProfile({ displayName: event.target.value })
              }}
            />
          </div>

          <div className="notice-box">
            Switching units converts the display of all historical weights without changing stored
            values.
          </div>

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
