export default function SeverityBadge({ severity }) {
  const map = {
    critical: 'badge-critical',
    high: 'badge-high',
    medium: 'badge-medium',
    low: 'badge-low',
  }
  return (
    <span className={map[severity] || 'badge-medium'}>
      {severity?.charAt(0).toUpperCase() + severity?.slice(1)}
    </span>
  )
}
