declare global {
  interface Window {
    _paq?: unknown[][]
  }
}

export function trackEvent(
  category: string,
  action: string,
  name?: string,
  value?: number
): void {
  if (typeof window === 'undefined' || !window._paq) return
  window._paq.push(['trackEvent', category, action, name, value])
}

export function trackSearch(
  keyword: string,
  category?: string,
  resultCount?: number
): void {
  if (typeof window === 'undefined' || !window._paq) return
  window._paq.push(['trackSiteSearch', keyword, category, resultCount])
}
