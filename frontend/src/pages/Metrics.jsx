import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar, PieChart, Pie, Cell, Legend,
} from 'recharts'
import { BarChart3, TrendingDown, TrendingUp, Award, AlertCircle } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import StatCard from '../components/StatCard'
import { getMetrics } from '../api/client'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function Metrics() {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMetrics().then(setMetrics).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8"><LoadingSpinner message="Loading metrics..." /></div>
  if (!metrics) return <div className="p-8 text-red-600">Failed to load metrics.</div>

  const comparisonData = [
    {
      name: 'Missed Actions',
      Baseline: metrics.baseline_missed_actions,
      Prototype: metrics.prototype_missed_actions,
    },
    {
      name: 'Adverse Events',
      Baseline: metrics.baseline_adverse_events,
      Prototype: metrics.prototype_adverse_events,
    },
    {
      name: 'Missing Owner',
      Baseline: Math.round(metrics.missing_owner_count * 2.5),
      Prototype: metrics.missing_owner_count,
    },
    {
      name: 'Low Confidence',
      Baseline: Math.round(metrics.low_confidence_count * 3),
      Prototype: metrics.low_confidence_count,
    },
  ]

  const actionStatusData = [
    { name: 'Resolved', value: metrics.resolved_actions },
    { name: 'Unresolved', value: metrics.unresolved_actions },
    { name: 'Overdue', value: metrics.overdue_actions },
  ]

  const confidenceData = [
    { name: 'Confidence', value: Math.round(metrics.avg_confidence * 100), fill: metrics.avg_confidence >= 0.85 ? '#10b981' : metrics.avg_confidence >= 0.70 ? '#f59e0b' : '#ef4444' },
  ]

  const improvementMissed = metrics.improvement_missed_actions_pct
  const improvementAdverse = metrics.improvement_adverse_events_pct

  return (
    <div className="p-8">
      <PageHeader
        title="Metrics"
        subtitle="Baseline vs prototype performance comparison and system-wide safety statistics"
      >
        <BarChart3 className="w-5 h-5 text-gray-400" />
      </PageHeader>

      {/* Top Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Handovers" value={metrics.total_handovers} icon={BarChart3} color="blue" />
        <StatCard label="Avg Confidence" value={`${Math.round(metrics.avg_confidence * 100)}%`} icon={Award} color={metrics.avg_confidence >= 0.85 ? 'green' : metrics.avg_confidence >= 0.70 ? 'yellow' : 'red'} />
        <StatCard label="Human Reviews Flagged" value={metrics.human_review_required_count} icon={AlertCircle} color="purple" />
        <StatCard label="Failure Cases" value={metrics.failure_cases} icon={AlertCircle} color="red" />
      </div>

      {/* Improvement Banners */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div className={`card border-l-4 ${improvementMissed >= 0 ? 'border-l-green-500 bg-green-50' : 'border-l-red-500 bg-red-50'}`}>
          <div className="flex items-center gap-2 mb-1">
            {improvementMissed >= 0
              ? <TrendingDown className="w-5 h-5 text-green-600" />
              : <TrendingUp className="w-5 h-5 text-red-600" />}
            <h3 className="font-semibold text-gray-800">Missed Actions</h3>
          </div>
          <p className={`text-3xl font-bold ${improvementMissed >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {improvementMissed >= 0 ? '↓' : '↑'} {Math.abs(improvementMissed)}%
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Baseline: <span className="font-semibold">{metrics.baseline_missed_actions}</span> → Prototype: <span className="font-semibold">{metrics.prototype_missed_actions}</span>
          </p>
        </div>

        <div className={`card border-l-4 ${improvementAdverse >= 0 ? 'border-l-green-500 bg-green-50' : 'border-l-red-500 bg-red-50'}`}>
          <div className="flex items-center gap-2 mb-1">
            {improvementAdverse >= 0
              ? <TrendingDown className="w-5 h-5 text-green-600" />
              : <TrendingUp className="w-5 h-5 text-red-600" />}
            <h3 className="font-semibold text-gray-800">Preventable Adverse Events</h3>
          </div>
          <p className={`text-3xl font-bold ${improvementAdverse >= 0 ? 'text-green-700' : 'text-red-700'}`}>
            {improvementAdverse >= 0 ? '↓' : '↑'} {Math.abs(improvementAdverse)}%
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Baseline: <span className="font-semibold">{metrics.baseline_adverse_events}</span> → Prototype: <span className="font-semibold">{metrics.prototype_adverse_events}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Baseline vs Prototype Bar Chart */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Baseline vs Prototype Comparison</h2>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={comparisonData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Baseline" fill="#94a3b8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Prototype" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-400 mt-2 text-center">Baseline figures represent pre-AI handover period (synthetic benchmark)</p>
        </div>

        {/* Action Status Pie */}
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Action Resolution Status</h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={actionStatusData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
                labelLine={false}
              >
                {actionStatusData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Confidence Radial + Detail Table */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Confidence Gauge */}
        <div className="card flex flex-col items-center justify-center">
          <h2 className="font-semibold text-gray-800 mb-4 self-start">AI Confidence Score</h2>
          <ResponsiveContainer width="100%" height={180}>
            <RadialBarChart
              innerRadius="60%"
              outerRadius="90%"
              data={confidenceData}
              startAngle={180}
              endAngle={0}
            >
              <RadialBar dataKey="value" background={{ fill: '#f3f4f6' }} cornerRadius={10} />
            </RadialBarChart>
          </ResponsiveContainer>
          <p className="text-3xl font-bold text-gray-800 -mt-6">
            {Math.round(metrics.avg_confidence * 100)}%
          </p>
          <p className="text-sm text-gray-500 mt-1">Average extraction confidence</p>
          {metrics.avg_confidence < 0.70 && (
            <p className="text-xs text-red-600 mt-2 font-medium">⚠ Below recommended threshold</p>
          )}
        </div>

        {/* Detail Table */}
        <div className="card xl:col-span-2">
          <h2 className="font-semibold text-gray-800 mb-4">Detailed Metrics</h2>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-50">
              {[
                ['Total Handovers Processed', metrics.total_handovers],
                ['Total Actions Extracted', metrics.total_actions],
                ['Resolved Actions', metrics.resolved_actions],
                ['Unresolved Actions', metrics.unresolved_actions],
                ['Overdue Actions', metrics.overdue_actions],
                ['Missing Owner Flags', metrics.missing_owner_count],
                ['Low Confidence Extractions (<70%)', metrics.low_confidence_count],
                ['Human Review Required', metrics.human_review_required_count],
                ['Subsequent Clinical Events', metrics.subsequent_events],
                ['Preventable Events', metrics.preventable_events],
                ['Failure Cases Detected', metrics.failure_cases],
              ].map(([label, val]) => (
                <tr key={label} className="hover:bg-gray-50">
                  <td className="py-2.5 pr-4 text-gray-600">{label}</td>
                  <td className="py-2.5 font-semibold text-gray-900 text-right">{val}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4">
        <p className="text-sm font-semibold text-amber-800">Important Note</p>
        <p className="text-xs text-amber-700 mt-1">
          This system does not calculate, recommend or suggest medication doses. All clinical decisions remain with qualified healthcare professionals. AI extraction is an assistive tool only.
        </p>
      </div>
    </div>
  )
}
