export const formatZulu = (timestamp: number | string): string => {
  if (!timestamp) return '--:--'
  const date = new Date(Number(timestamp) * 1000)
  return date.toISOString().substr(11, 5) + ' Z'
}

export const formatLocal = (timestamp: number | string): string => {
  if (!timestamp) return '--:--'
  const date = new Date(Number(timestamp) * 1000)
  return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
}

export const formatDuration = (seconds: number | string): string => {
  if (!seconds) return '--:--'
  const totalMinutes = Math.floor(Number(seconds) / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}
