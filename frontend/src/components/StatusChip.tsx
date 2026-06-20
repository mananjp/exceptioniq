interface StatusChipProps {
  status: string
}

export default function StatusChip({ status }: StatusChipProps) {
  const formatLabel = (txt: string) => {
    return txt
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
  }

  return (
    <span className={`chip chip-${status}`}>
      {formatLabel(status)}
    </span>
  )
}
