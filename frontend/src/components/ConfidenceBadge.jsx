export default function ConfidenceBadge({ score }) {
  const pct = Math.round(score * 100)
  let cls, label

  if (score >= 0.85) {
    cls = 'bg-green-100 text-green-800'
    label = 'High'
  } else if (score >= 0.70) {
    cls = 'bg-yellow-100 text-yellow-800'
    label = 'Medium'
  } else {
    cls = 'bg-red-100 text-red-800'
    label = 'Low ⚠'
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      {label} {pct}%
    </span>
  )
}
