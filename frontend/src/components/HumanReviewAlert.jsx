import { AlertCircle } from 'lucide-react'

export default function HumanReviewAlert({ reason }) {
  return (
    <div className="flex items-start gap-3 bg-purple-50 border border-purple-200 rounded-lg px-4 py-3">
      <AlertCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-purple-800">Human Review Required</p>
        {reason && <p className="text-xs text-purple-600 mt-0.5">{reason}</p>}
      </div>
    </div>
  )
}
