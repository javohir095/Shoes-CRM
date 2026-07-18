export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('uz-UZ', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(amount) + " so'm"
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr)
  const diffMs = Date.now() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 1) return 'hozir'
  if (diffMins < 60) return `${diffMins} daqiqa oldin`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} soat oldin`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 30) return `${diffDays} kun oldin`
  return formatDate(dateStr)
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}
