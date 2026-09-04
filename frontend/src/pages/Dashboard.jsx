import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText, CheckCircle2, Clock, UserX, AlertCircle,
  Activity, ShieldAlert, Building2, TrendingUp, ChevronRight,
} from 'lucide-react'
import StatCard from '../components/StatCard'
import LoadingSpinner from '../components/LoadingSpinner'
import PageHeader from '../components/PageHeader'
import { getDashboardSummary } from '../api/client'

const shiftColors = { day: 'bg-yellow-100 text-yellow-800', night: 'bg-indigo-100 text-indigo-800', evening: 'bg-orange-100 text-orange-800' }
const severityColors = { critical: 'bg-red-100 text-red-800', high: 'bg-orange-100 text-orange-800', medium: 'bg-yellow-100 text-yellow-800', low: 'bg-green-100 text-green-800' }

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getDashboardSummary()
      .then(setData)
      .catch(() => setError('Could not reach the API. Is the backend running?'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8"><LoadingSpinner message="Loading dashboard..." /></div>

  if (error) return (
    <div className="p-8">
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <ShieldAlert className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <p className="font-semibold text-red-700">{error}</p>
        <p className="text-sm text-red-500 mt-1">Start the backend with <code className="bg-red-100 px-1 rounded">uvicorn main:app --reload</code></p>
      </div>
    </div>
  )

  return (
    <div className="p-8">
      <PageHeader
        title="Dashboard"
        subtitle="Real-time overview of handover safety across all wards"
      >
        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">Live</span>
      </PageHeader>

      {/* Stat Grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Handovers" value={data.total_handovers} icon={FileText} color="blue" />
        <StatCard label="Resolved Actions" value={data.resolved_actions} icon={CheckCircle2} color="green" />
        <StatCard label="Unresolved Actions" value={data.unresolved_actions} icon={Clock} color="orange" sub="Carried to next shift" />
        <StatCard label="Overdue Actions" value={data.overdue_actions} icon={AlertCircle} color="red" sub="Past deadline" />
        <StatCard label="Missing Owner" value={data.missing_owner_count} icon={UserX} color="red" sub="No staff assigned" />
        <StatCard label="Human Reviews" value={data.human_review_required_count} icon={AlertCircle} color="purple" sub="Low confidence flags" />
        <StatCard label="Subsequent Events" value={data.subsequent_events} icon={Activity} color="orange" />
        <StatCard label="Wards Monitored" value={data.wards_monitored} icon={Building2} color="gray" />
      </div>

      {/* AI Confidence */}
      <div className="card mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800">Average AI Extraction Confidence</h2>
          <span className="text-sm text-gray-500">Across all handover notes</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
            <div
              className={`h-4 rounded-full transition-all ${
                data.avg_confidence >= 0.85 ? 'bg-green-500' :
                data.avg_confidence >= 0.70 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.round(data.avg_confidence * 100)}%` }}
            />
          </div>
          <span className="text-lg font-bold text-gray-700 w-16 text-right">
            {Math.round(data.avg_confidence * 100)}%
          </span>
        </div>
        {data.avg_confidence < 0.70 && (
          <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" /> Below threshold — increased human review recommended
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Handovers */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Recent Handovers</h2>
            <Link to="/analysis" className="text-xs text-brand-600 hover:underline flex items-center gap-0.5">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {data.recent_notes.map((note) => (
              <div key={note.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-800">{note.ward}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{note.outgoing_nurse} → {note.incoming_nurse}</p>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${shiftColors[note.shift_type] || 'bg-gray-100 text-gray-600'}`}>
                    {note.shift_type}
                  </span>
                  <span className="text-xs text-gray-400">{note.shift_date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Events */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-800">Recent Subsequent Events</h2>
            <Link to="/subsequent-events" className="text-xs text-brand-600 hover:underline flex items-center gap-0.5">
              View all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {data.recent_events.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No events recorded</p>
            )}
            {data.recent_events.map((ev) => (
              <div key={ev.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-800">{ev.patient_name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{ev.event_type} — {ev.shift_date}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${severityColors[ev.severity] || 'bg-gray-100 text-gray-600'}`}>
                  {ev.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="mt-6 grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { to: '/analysis', label: 'Analyse Handover', icon: FileText, color: 'brand' },
          { to: '/shift-change', label: 'Shift Change', icon: TrendingUp, color: 'indigo' },
          { to: '/failure-cases', label: 'Failure Cases', icon: ShieldAlert, color: 'red' },
          { to: '/metrics', label: 'View Metrics', icon: Activity, color: 'green' },
        ].map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-brand-300 hover:shadow-sm transition-all text-sm font-medium text-gray-700 hover:text-brand-700"
          >
            <Icon className="w-4 h-4" />
            {label}
            <ChevronRight className="w-3 h-3 ml-auto" />
          </Link>
        ))}
      </div>
    </div>
  )
}
