import { useState, useEffect } from 'react'

interface SlaCountdownProps {
  deadlineStr: string | null
  status: string
}

export default function SlaCountdown({ deadlineStr, status }: SlaCountdownProps) {
  const [text, setText] = useState('N/A')
  const [colorClass, setColorClass] = useState('sla-active')

  useEffect(() => {
    if (!deadlineStr) {
      setText('N/A')
      setColorClass('sla-active')
      return
    }

    if (status === 'closed' || status === 'approved') {
      setText('Completed')
      setColorClass('sla-active')
      return
    }

    const updateTimer = () => {
      const target = new Date(deadlineStr).getTime()
      const now = new Date().getTime()
      const diff = target - now

      if (diff <= 0) {
        setText('Breached!')
        setColorClass('sla-breached')
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

      if (hours < 6) {
        setColorClass('sla-warning')
      } else {
        setColorClass('sla-active')
      }

      setText(`${hours}h ${minutes}m`)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [deadlineStr, status])

  return (
    <span className={colorClass}>
      {text}
    </span>
  )
}
