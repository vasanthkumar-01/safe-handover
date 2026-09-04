import { useEffect, useState } from 'react'
import { ArrowLeftRight, AlertCircle, CheckCircle2, Clock, UserX } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import ConfidenceBadge from '../components/ConfidenceBadge'
import HumanReviewAlert from '../components/HumanReviewAlert'
import StatCard from '../components/StatCard'
import { getShiftChanges, getUnresolvedAtShiftChange } from '../api/client'

export default function ShiftChange() {
  const [shiftChanges, setShiftChanges] = useState([])
  const [unresolved, setUnresolved] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([getShiftChanges(), getUnresolvedAtShiftChange()])
      .then(([sc, ur]) => {
        setShiftChanges(sc)
        setUnresolved(ur)
      })
      .catch(() => setError('Failed to load shift change data'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8"><LoadingSpinner message="Loading shift change data..." /></div>

  const totalUnresolved = shiftChanges.reduce((s, c) => s + c.unresolved_count, 0)
  const totalResolved = shiftChanges.reduce((s, c) => s + c.resolved_count, 0)

  return (
    <div className="p-8">
      <PageHeader
        title="Shift Change"
        subtitle="Unresolved actions detected at each shift handover boundary"
      >
        <ArrowLeftRight className="w-5 h-5 text-gray-400" />
      </PageHeader>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard label="Shift Changes Recorded" value={shiftChanges.length} icon={ArrowLeftRight} color="blue" />
        <StatCard label="Total Unresolved" value={totalUnresolved} icon={Clock} color="orange" sub="Across all shifts" />
        <StatCard label="Total Resolved" value={totalResolved} icon={CheckCircle2} color="green" />
        <StatCard
          label="Currently Unresolved"
          value={unresolved?.count ?? 0}
          icon={AlertCircle}
          color="red"
          sub="Pending right now"
        />
      </div>

      {/* Currently Unresolved Actions */}
      {unresolved && unresolved.count > 0 && (
        <div className="card mb-8 border-orange-200 bg-orange-50">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <h2 className="font-semibold text-orange-800">
              {unresolved.count} Action{unresolved.count !== 1 ? 's' : ''} Unresolved at Current Shift Change
            </h2>
          </div>
          <div className="space-y-3">
            {unresolved.actions.map(a => (
              <div key={a.id} className="bg-white rounded-lg p-4 border border-orange-100">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">{a.patient_name}</p>
                      <ConfidenceBadge score={a.confidence} />
                      {a.missing_owner && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          <UserX className="w-3 h-3" /> No Owner
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-red-700 font-medium mt-1">⚠ Risk: {a.risk}</p>
                    <p className="text-sm text-gray-600 mt-0.5">Action: {a.action}</p>
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      <span>Owner: <span className={a.owner ? 'text-gray-700 font-medium' : 'text-red-600 font-medium'}>{a.owner || 'NOT ASSIGNED'}</span></span>
                      <span>Deadline: <span className="text-gray-700 font-medium">{a.deadline}</span></span>
                    </div>
                  </div>
                </div>
                {a.human_review_required && (
                  <div className="mt-3">
                    <HumanReviewAlert reason={
                      a.missing_owner
                        ? 'Owner not specified — manual assignment required before next shift.'
                        : `Confidence ${Math.round(a.confidence * 100)}% — insufficient for autonomous handover.`
                    } />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {unresolved && unresolved.count === 0 && (
        <div className="card mb-8 border-green-200 bg-green-50 flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-green-600" />
          <div>
            <p className="font-semibold text-green-800">All actions resolved</p>
            <p className="text-sm text-green-600">No unresolved actions at the current shift boundary.</p>
          </div>
        </div>
      )}

      {/* Shift Change History */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">Shift Change History</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                <th className="pb-2 pr-4 font-semibold">Date</th>
                <th className="pb-2 pr-4 font-semibold">Ward</th>
                <th className="pb-2 pr-4 font-semibold">Resolved</th>
                <th className="pb-2 pr-4 font-semibold">Unresolved</th>
                <th className="pb-2 font-semibold">Resolution Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {shiftChanges.map(sc => {
                const total = sc.resolved_count + sc.unresolved_count
                const rate = total > 0 ? Math.round((sc.resolved_count / total) * 100) : 0
                return (
                  <tr key={sc.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 pr-4 font-medium text-gray-800">{sc.shift_date}</td>
                    <td className="py-3 pr-4 text-gray-600">{sc.ward}</td>
                    <td className="py-3 pr-4">
                      <span className="text-green-700 font-semibold">{sc.resolved_count}</span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`font-semibold ${sc.unresolved_count > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                        {sc.unresolved_count}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-2 w-24 overflow-hidden">
                          <div
                            className={`h-2 rounded-full ${rate >= 80 ? 'bg-green-500' : rate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-600">{rate}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {shiftChanges.length === 0 && (
            <p className="text-center text-sm text-gray-400 py-8">No shift change records found.</p>
          )}
        </div>
      </div>
    </div>
  )
}
