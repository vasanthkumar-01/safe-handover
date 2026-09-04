import { useEffect, useState } from 'react'
import { FileSearch, Send, CheckCircle2, AlertCircle, User, Clock, ShieldAlert } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import LoadingSpinner from '../components/LoadingSpinner'
import ConfidenceBadge from '../components/ConfidenceBadge'
import HumanReviewAlert from '../components/HumanReviewAlert'
import { getActions, analyzeHandover, resolveAction } from '../api/client'

const SHIFT_TYPES = ['day', 'evening', 'night']
const WARDS = ['Ward 6B', 'Ward 8A', 'Cardiac Ward', 'Neuro Ward', 'ICU', 'ED']

const empty = {
  note_text: '',
  ward: 'Ward 6B',
  shift_date: new Date().toISOString().slice(0, 10),
  shift_type: 'day',
  outgoing_nurse: '',
  incoming_nurse: '',
  patient_id: '',
  patient_name: '',
}

export default function HandoverAnalysis() {
  const [actions, setActions] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(empty)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const load = () =>
    getActions()
      .then(setActions)
      .catch(() => setError('Failed to load actions'))
      .finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setResult(null)
    try {
      const res = await analyzeHandover(form)
      setResult(res)
      setForm(empty)
      load()
    } catch {
      setError('Analysis failed. Is the backend running?')
    } finally {
      setSubmitting(false)
    }
  }

  const handleResolve = async (id) => {
    await resolveAction(id)
    load()
  }

  return (
    <div className="p-8">
      <PageHeader
        title="Handover Analysis"
        subtitle="Submit a handover note for AI-powered risk, action, owner and deadline extraction"
      >
        <FileSearch className="w-5 h-5 text-gray-400" />
      </PageHeader>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="card mb-8">
        <h2 className="font-semibold text-gray-800 mb-4">Submit New Handover Note</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Patient Name</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
              placeholder="e.g. John Davies"
              value={form.patient_name}
              onChange={e => setForm(f => ({ ...f, patient_name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Patient ID</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
              placeholder="e.g. PT-011"
              value={form.patient_id}
              onChange={e => setForm(f => ({ ...f, patient_id: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Ward</label>
            <select
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
              value={form.ward}
              onChange={e => setForm(f => ({ ...f, ward: e.target.value }))}
            >
              {WARDS.map(w => <option key={w}>{w}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Shift Date</label>
            <input
              type="date"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
              value={form.shift_date}
              onChange={e => setForm(f => ({ ...f, shift_date: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Shift Type</label>
            <select
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
              value={form.shift_type}
              onChange={e => setForm(f => ({ ...f, shift_type: e.target.value }))}
            >
              {SHIFT_TYPES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Outgoing Nurse</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
              placeholder="e.g. Nurse Williams"
              value={form.outgoing_nurse}
              onChange={e => setForm(f => ({ ...f, outgoing_nurse: e.target.value }))}
              required
            />
          </div>
          <div className="md:col-span-2 lg:col-span-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">Incoming Nurse</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
              placeholder="e.g. Charge Nurse Taylor"
              value={form.incoming_nurse}
              onChange={e => setForm(f => ({ ...f, incoming_nurse: e.target.value }))}
              required
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-600 mb-1">Handover Note Text</label>
          <textarea
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300 resize-none"
            rows={5}
            placeholder="Enter the full clinical handover note here. Include patient risks, required actions, assigned staff and deadlines..."
            value={form.note_text}
            onChange={e => setForm(f => ({ ...f, note_text: e.target.value }))}
            required
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-60"
        >
          {submitting ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Analysing...</>
          ) : (
            <><Send className="w-4 h-4" /> Analyse Note</>
          )}
        </button>
      </form>

      {/* Extraction Result */}
      {result && (
        <div className="card mb-8 border-brand-200 bg-brand-50">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <h2 className="font-semibold text-gray-800">Extraction Result</h2>
            <ConfidenceBadge score={result.extraction.confidence} />
          </div>

          {result.extraction.human_review_required && (
            <div className="mb-4">
              <HumanReviewAlert reason={
                result.extraction.missing_owner
                  ? 'No owner identified in the note — please assign a responsible staff member manually.'
                  : `Low confidence score (${Math.round(result.extraction.confidence * 100)}%) — the note may lack sufficient clinical detail.`
              } />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Identified Risk', value: result.extraction.risk, icon: ShieldAlert, color: 'text-red-600' },
              { label: 'Required Action', value: result.extraction.action, icon: CheckCircle2, color: 'text-blue-600' },
              { label: 'Assigned Owner', value: result.extraction.owner || 'NOT SPECIFIED', icon: User, color: result.extraction.missing_owner ? 'text-red-600' : 'text-green-600' },
              { label: 'Deadline', value: result.extraction.deadline, icon: Clock, color: 'text-orange-600' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white rounded-lg p-4 border border-gray-100">
                <div className={`flex items-center gap-2 text-xs font-semibold mb-1 ${color}`}>
                  <Icon className="w-3.5 h-3.5" /> {label}
                </div>
                <p className="text-sm text-gray-800 font-medium">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Extracted Actions Table */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">All Extracted Actions</h2>
        {loading ? <LoadingSpinner /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                  <th className="pb-2 pr-4 font-semibold">Patient</th>
                  <th className="pb-2 pr-4 font-semibold">Risk</th>
                  <th className="pb-2 pr-4 font-semibold">Action</th>
                  <th className="pb-2 pr-4 font-semibold">Owner</th>
                  <th className="pb-2 pr-4 font-semibold">Deadline</th>
                  <th className="pb-2 pr-4 font-semibold">Confidence</th>
                  <th className="pb-2 pr-4 font-semibold">Status</th>
                  <th className="pb-2 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {actions.map(a => (
                  <tr key={a.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 pr-4">
                      <p className="font-medium text-gray-900">{a.patient_name}</p>
                      <p className="text-xs text-gray-400">{a.patient_id}</p>
                    </td>
                    <td className="py-3 pr-4 max-w-[160px]">
                      <p className="text-gray-700 truncate">{a.risk}</p>
                      {a.human_review_required && (
                        <span className="badge-review text-xs mt-0.5">Review</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 max-w-[160px]">
                      <p className="text-gray-700 truncate">{a.action}</p>
                    </td>
                    <td className="py-3 pr-4">
                      {a.missing_owner ? (
                        <span className="flex items-center gap-1 text-red-600 text-xs font-medium">
                          <AlertCircle className="w-3.5 h-3.5" /> Missing
                        </span>
                      ) : (
                        <span className="text-gray-700">{a.owner}</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-gray-600 text-xs">{a.deadline}</td>
                    <td className="py-3 pr-4">
                      <ConfidenceBadge score={a.confidence} />
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        a.status === 'resolved' ? 'bg-green-100 text-green-700' :
                        a.status === 'overdue' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {a.status}
                      </span>
                    </td>
                    <td className="py-3">
                      {a.status !== 'resolved' && (
                        <button
                          onClick={() => handleResolve(a.id)}
                          className="text-xs text-brand-600 hover:text-brand-800 font-medium px-2 py-1 rounded hover:bg-brand-50 transition-colors"
                        >
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {actions.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-8">No extracted actions yet. Submit a handover note above.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
