import { useEffect, useState } from 'react'
import { Activity, AlertTriangle, ShieldCheck, Filter } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import SeverityBadge from '../components/SeverityBadge'
import StatCard from '../components/StatCard'
import { getSubsequentEvents } from '../api/client'

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 }

export default function SubsequentEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all | preventable | critical

  useEffect(() => {
    getSubsequentEvents()
      .then(data => setEvents(data.sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 4) - (SEVERITY_ORDER[b.severity] ?? 4))))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = events.filter(e => {
    if (filter === 'preventable') return e.was_preventable
    if (filter === 'critical') return e.severity === 'critical'
    return true
  })

  const critical = events.filter(e => e.severity === 'critical').length
  const preventable = events.filter(e => e.was_preventable).length

  const eventTypeCounts = events.reduce((acc, e) => {
    acc[e.event_type] = (acc[e.event_type] || 0) + 1
    return acc
  }, {})

  if (loading) return <div className="p-8"><LoadingSpinner message="Loading subsequent events..." /></div>

  return (
    <div className="p-8">
      <PageHeader
        title="Subsequent Events"
        subtitle="Clinical events that occurred after an unresolved or high-risk handover action"
      >
        <Activity className="w-5 h-5 text-gray-400" />
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Events" value={events.length} icon={Activity} color="orange" />
        <StatCard label="Critical Events" value={critical} icon={AlertTriangle} color="red" />
        <StatCard label="Preventable Events" value={preventable} icon={ShieldCheck} color="purple" sub="Related to unresolved actions" />
        <StatCard label="Event Types" value={Object.keys(eventTypeCounts).length} icon={Filter} color="blue" />
      </div>

      {/* Event Type Breakdown */}
      <div className="card mb-6">
        <h2 className="font-semibold text-gray-800 mb-4">Events by Type</h2>
        <div className="flex flex-wrap gap-3">
          {Object.entries(eventTypeCounts).map(([type, count]) => (
            <div key={type} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2">
              <span className="text-sm font-medium text-gray-800">{type}</span>
              <span className="text-xs font-bold text-white bg-gray-500 rounded-full px-2 py-0.5">{count}</span>
            </div>
          ))}
          {events.length === 0 && <p className="text-sm text-gray-400">No events recorded.</p>}
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {[
          { key: 'all', label: `All (${events.length})` },
          { key: 'preventable', label: `Preventable (${preventable})` },
          { key: 'critical', label: `Critical (${critical})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === key
                ? 'bg-brand-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {filtered.map(ev => (
          <div
            key={ev.id}
            className={`card border-l-4 ${
              ev.severity === 'critical' ? 'border-l-red-500' :
              ev.severity === 'high' ? 'border-l-orange-500' :
              ev.severity === 'medium' ? 'border-l-yellow-500' : 'border-l-green-500'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <h3 className="font-semibold text-gray-900">{ev.patient_name}</h3>
                  <SeverityBadge severity={ev.severity} />
                  <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{ev.event_type}</span>
                  {ev.was_preventable && (
                    <span className="badge-review">Potentially Preventable</span>
                  )}
                </div>

                <p className="text-sm text-gray-700 mb-3">{ev.event_description}</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                    <p className="text-xs font-semibold text-red-700 mb-1">Related Risk</p>
                    <p className="text-sm text-red-800">{ev.related_risk}</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                    <p className="text-xs font-semibold text-gray-600 mb-1">Patient ID</p>
                    <p className="text-sm font-mono text-gray-700">{ev.patient_id}</p>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                    <p className="text-xs font-semibold text-gray-600 mb-1">Shift Date</p>
                    <p className="text-sm text-gray-700">{ev.shift_date}</p>
                  </div>
                </div>

                {ev.was_preventable && (
                  <div className="mt-3 bg-purple-50 border border-purple-100 rounded-lg px-4 py-3">
                    <p className="text-xs font-semibold text-purple-700">
                      ⚠ This event is linked to an unresolved handover action. Timely escalation may have prevented this outcome.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="card text-center py-12">
            <ShieldCheck className="w-10 h-10 text-green-400 mx-auto mb-2" />
            <p className="text-gray-500 font-medium">No events match this filter</p>
          </div>
        )}
      </div>
    </div>
  )
}
