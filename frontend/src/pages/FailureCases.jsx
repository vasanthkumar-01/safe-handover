import { useEffect, useState } from 'react'
import { XCircle, UserX, Clock, AlertCircle, Brain, CheckCircle2 } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import SeverityBadge from '../components/SeverityBadge'
import StatCard from '../components/StatCard'
import { getFailureCases, getFailureCasesSummary } from '../api/client'

const FAILURE_META = {
  missing_owner: {
    label: 'Missing Owner',
    icon: UserX,
    color: 'red',
    desc: 'No staff member was assigned responsibility for the action.',
    badgeCls: 'bg-red-100 text-red-800',
  },
  overdue: {
    label: 'Overdue Action',
    icon: Clock,
    color: 'orange',
    desc: 'Action was not completed before its specified deadline.',
    badgeCls: 'bg-orange-100 text-orange-800',
  },
  low_confidence: {
    label: 'Low Confidence',
    icon: Brain,
    color: 'purple',
    desc: 'AI extraction confidence was below the 70% threshold — human review required.',
    badgeCls: 'bg-purple-100 text-purple-800',
  },
  unresolved: {
    label: 'Unresolved at Shift Change',
    icon: AlertCircle,
    color: 'yellow',
    desc: 'Action was carried over unsatisfied to the next shift.',
    badgeCls: 'bg-yellow-100 text-yellow-800',
  },
}

export default function FailureCases() {
  const [cases, setCases] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')

  useEffect(() => {
    Promise.all([getFailureCases(), getFailureCasesSummary()])
      .then(([c, s]) => {
        setCases(c)
        setSummary(s)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = activeFilter === 'all' ? cases : cases.filter(c => c.failure_type === activeFilter)

  if (loading) return <div className="p-8"><LoadingSpinner message="Loading failure cases..." /></div>

  return (
    <div className="p-8">
      <PageHeader
        title="Failure Cases"
        subtitle="Systematic failures detected: missing owner, overdue deadlines, low confidence, and unresolved actions"
      >
        <XCircle className="w-5 h-5 text-gray-400" />
      </PageHeader>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Failures" value={summary?.total ?? 0} icon={XCircle} color="red" />
        <StatCard label="Unresolved" value={summary?.unresolved ?? 0} icon={AlertCircle} color="orange" sub="Still open" />
        <StatCard label="Missing Owner" value={summary?.by_type?.missing_owner ?? 0} icon={UserX} color="red" />
        <StatCard label="Low Confidence" value={summary?.by_type?.low_confidence ?? 0} icon={Brain} color="purple" />
      </div>

      {/* Failure Type Breakdown */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
        {Object.entries(FAILURE_META).map(([key, meta]) => {
          const count = summary?.by_type?.[key] ?? 0
          const Icon = meta.icon
          return (
            <button
              key={key}
              onClick={() => setActiveFilter(activeFilter === key ? 'all' : key)}
              className={`card text-left transition-all hover:shadow-md ${activeFilter === key ? 'ring-2 ring-brand-400' : ''}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 text-${meta.color}-600`} />
                <span className="text-xs font-semibold text-gray-700">{meta.label}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className="text-xs text-gray-400 mt-1 leading-tight">{meta.desc}</p>
            </button>
          )
        })}
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            activeFilter === 'all' ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-300'
          }`}
        >
          All ({cases.length})
        </button>
        {Object.entries(FAILURE_META).map(([key, meta]) => {
          const count = cases.filter(c => c.failure_type === key).length
          return (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeFilter === key ? 'bg-brand-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-300'
              }`}
            >
              {meta.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Cases List */}
      <div className="space-y-3">
        {filtered.map(fc => {
          const meta = FAILURE_META[fc.failure_type] || FAILURE_META.unresolved
          const Icon = meta.icon
          return (
            <div
              key={fc.id}
              className={`card flex items-start gap-4 ${fc.resolved ? 'opacity-60' : ''}`}
            >
              <div className={`p-2.5 rounded-lg bg-${meta.color}-50 flex-shrink-0`}>
                <Icon className={`w-5 h-5 text-${meta.color}-600`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap mb-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${meta.badgeCls}`}>
                    {meta.label}
                  </span>
                  <SeverityBadge severity={fc.severity} />
                  {fc.resolved && (
                    <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full font-medium">
                      <CheckCircle2 className="w-3 h-3" /> Resolved
                    </span>
                  )}
                </div>
                <p className="text-sm font-semibold text-gray-900 mb-0.5">{fc.patient_name} <span className="text-gray-400 font-normal text-xs">({fc.patient_id})</span></p>
                <p className="text-sm text-gray-600">{fc.description}</p>
                <p className="text-xs text-gray-400 mt-1">Ward: {fc.ward}</p>
              </div>
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="card text-center py-12">
            <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-2" />
            <p className="text-gray-500 font-medium">No failure cases in this category</p>
          </div>
        )}
      </div>
    </div>
  )
}
