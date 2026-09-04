import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  FileSearch,
  ArrowLeftRight,
  AlertTriangle,
  XCircle,
  BarChart3,
  ShieldCheck,
} from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/analysis', label: 'Handover Analysis', icon: FileSearch },
  { to: '/shift-change', label: 'Shift Change', icon: ArrowLeftRight },
  { to: '/subsequent-events', label: 'Subsequent Events', icon: AlertTriangle },
  { to: '/failure-cases', label: 'Failure Cases', icon: XCircle },
  { to: '/metrics', label: 'Metrics', icon: BarChart3 },
]

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-brand-900 text-white flex flex-col">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-brand-800">
          <ShieldCheck className="w-8 h-8 text-brand-300" />
          <div>
            <div className="font-bold text-lg leading-tight">SafeHandover</div>
            <div className="text-xs text-brand-400 font-medium tracking-wide">AI Platform</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-700 text-white'
                    : 'text-brand-200 hover:bg-brand-800 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-brand-800 text-xs text-brand-400">
          <p className="font-semibold text-brand-300">SafeHandover AI v1.0</p>
          <p className="mt-0.5">Clinical risk detection system</p>
          <p className="mt-1 text-brand-500">No medication doses recommended.</p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
