export function getSafeReturnPath(location) {
  const pathname = location?.pathname
  if (typeof pathname !== 'string' || !pathname.startsWith('/') || pathname.startsWith('//')) return '/'

  return `${pathname}${location.search || ''}${location.hash || ''}`
}
