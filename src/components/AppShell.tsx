import { NavLink, useLocation } from 'react-router-dom'
import type { PropsWithChildren, ReactNode } from 'react'

type ActiveTab = 'log' | 'stats' | 'settings'

interface AppShellProps extends PropsWithChildren {
  activeTab: ActiveTab
  headerAction?: ReactNode
}

const navItems: Array<{ label: string; icon: string; tab: ActiveTab; href: string }> = [
  { label: 'Log', icon: 'edit_note', tab: 'log', href: '/' },
  { label: 'Stats', icon: 'leaderboard', tab: 'stats', href: '/history' },
  { label: 'Settings', icon: 'settings', tab: 'settings', href: '/settings' },
]

export function AppShell({ activeTab, children, headerAction }: AppShellProps) {
  const location = useLocation()
  const isEditor = location.pathname.includes('/workouts/') && location.pathname.includes('/edit')
  const headerClassName = `app-header${isEditor ? ' app-header--editor' : ''}`

  return (
    <div className="app-frame">
      <header className={headerClassName}>
        <button type="button" className="icon-button" aria-label="Open menu">
          <span className="material-symbols-outlined">menu</span>
        </button>
        <div className="wordmark">RepLog</div>
        {headerAction ?? (
          <button type="button" className="icon-button" aria-label="Profile">
            <span className="material-symbols-outlined">account_circle</span>
          </button>
        )}
      </header>

      <main className="app-main">{children}</main>

      <nav className="bottom-nav" aria-label="Primary">
        {navItems.map((item) => (
          <NavLink
            key={item.tab}
            to={item.href}
            className={`bottom-nav__item${item.tab === activeTab ? ' bottom-nav__item--active' : ''}`}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
