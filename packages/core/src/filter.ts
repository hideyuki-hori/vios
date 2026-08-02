export const filterByQuery = <T>(items: T[], query: string, text: (item: T) => string): T[] => {
  const terms = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term !== '')
  if (terms.length === 0) return items
  return items.filter((item) => {
    const haystack = text(item).toLowerCase()
    return terms.every((term) => haystack.includes(term))
  })
}
