export function byId(id: string): HTMLElement {
  const element = document.getElementById(id)
  if (!element) throw new Error(`missing element: ${id}`)
  return element
}

export function inputById(id: string): HTMLInputElement {
  const element = byId(id)
  if (!(element instanceof HTMLInputElement)) throw new Error(`not an input: ${id}`)
  return element
}
