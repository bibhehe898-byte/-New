import { Boxes, ChartColumn, Compass, LogOut, Workflow } from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/useAuthStore'
import './Layout.css'

const NAV_ITEMS = [
  { to: '/', label: '3D-тур', icon: Compass, end: true },
  { to: '/editor', label: 'Редактор КПСЦ', icon: Workflow },
  { to: '/dashboard', label: 'Дашборд До/После', icon: ChartColumn },
]

export default function Layout() {
  const logout = useAuthStore((state) => state.logout)

  return (
    <div className="app-shell">
      <header className="app-header">
        <NavLink to="/" className="brand" aria-label="Kataxone — на главную">
          <span className="brand-mark">
            <Boxes size={19} strokeWidth={2.2} aria-hidden="true" />
          </span>
          <span className="brand-text">
            <strong>Kataxone</strong>
            <small>3D-карта потока создания ценности</small>
          </span>
        </NavLink>

        <nav className="app-nav" aria-label="Основная навигация">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              aria-label={label}
              className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}
            >
              <Icon size={16} strokeWidth={2} aria-hidden="true" />
              <span className="nav-link__label">{label}</span>
            </NavLink>
          ))}
        </nav>

        <span className="header-status" title="Версия MVP">
          <span className="status-dot" aria-hidden="true" />
          MVP&nbsp;0.1
        </span>

        <button type="button" className="btn" onClick={logout}>
          <LogOut size={15} aria-hidden="true" />
          Выйти
        </button>
      </header>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
