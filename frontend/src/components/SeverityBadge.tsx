interface SeverityBadgeProps {
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export default function SeverityBadge({ severity }: SeverityBadgeProps) {
  const cap = severity.charAt(0).toUpperCase() + severity.slice(1)
  
  return (
    <span className={`chip badge-${severity}`}>
      {cap}
    </span>
  )
}
