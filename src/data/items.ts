// TEMPLATE: Generic Items data model and local demo storage for this Code App template.
export type ItemStatus = 'Active' | 'In Use' | 'On Hold' | 'Archived'

export type Item = {
  id: string
  name: string
  category: string
  status: ItemStatus
  quantity: number
  owner: string
  updatedAt: string
}

export type ItemDraft = Omit<Item, 'id' | 'updatedAt'>

const storageKey = 'code-app-template-items'

export const starterItems: Item[] = [
  { id: 'item-001', name: 'Sample item 01', category: 'General', status: 'Active', quantity: 12, owner: 'Workspace team', updatedAt: '2026-10-10' },
  { id: 'item-002', name: 'Sample item 02', category: 'Reference', status: 'In Use', quantity: 4, owner: 'Project team', updatedAt: '2026-10-08' },
  { id: 'item-003', name: 'Sample item 03', category: 'General', status: 'On Hold', quantity: 0, owner: 'Unassigned', updatedAt: '2026-10-05' },
  ...[
    'Access card set', 'Adapter kit', 'Archive binder', 'Audio headset', 'Backup drive', 'Badge holder', 'Cable organizer', 'Camera tripod', 'Charging station', 'Conference speaker', 'Desk lamp', 'Display cable', 'Document folder', 'Docking station', 'Ergonomic keyboard', 'Extension cord', 'Field notebook', 'First aid kit', 'Handheld scanner', 'Headset stand', 'HDMI adapter', 'Laptop sleeve', 'Label printer', 'Locking cabinet key', 'Meeting room remote', 'Monitor stand', 'Network switch', 'Office toolkit', 'Presentation pointer', 'Projector screen', 'Protective case', 'Reception tablet', 'Safety glasses', 'Sample container', 'Shipping scale', 'Spare battery pack', 'Storage box', 'Tablet stand', 'Team whiteboard', 'Travel adapter', 'USB hub', 'Video conference camera', 'Visitor lanyard', 'Webcam cover', 'Wireless mouse', 'Workspace sign', 'Writing supply set',
  ].map((name, index): Item => {
    const number = index + 4
    const categories = ['Equipment', 'Office supplies', 'IT accessories', 'Reference', 'Facilities', 'General']
    const statuses: ItemStatus[] = ['Active', 'In Use', 'On Hold', 'Archived']
    const owners = ['Workspace team', 'Project team', 'Operations', 'IT support', 'Facilities', 'Unassigned']
    const day = String(1 + (number * 3) % 12).padStart(2, '0')
    return {
      id: `item-${String(number).padStart(3, '0')}`,
      name,
      category: categories[index % categories.length],
      status: statuses[index % statuses.length],
      quantity: (number * 7) % 36,
      owner: owners[index % owners.length],
      updatedAt: `2026-10-${day}`,
    }
  }),
]

export function loadItems(): Item[] {
  try {
    const saved = window.localStorage.getItem(storageKey)
    if (!saved) return starterItems
    const parsed: unknown = JSON.parse(saved)
    if (!Array.isArray(parsed)) return starterItems
    // TEMPLATE: Expand the original three-row demo set while preserving any existing edits.
    const oldDemoIds = new Set(['item-001', 'item-002', 'item-003'])
    if (parsed.length === 3 && parsed.every((item) => item && oldDemoIds.has(item.id))) {
      return [...parsed as Item[], ...starterItems.slice(3)]
    }
    return parsed as Item[]
  } catch {
    return starterItems
  }
}

export function saveItems(items: Item[]) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(items))
  } catch {
    // Local storage can be unavailable in restricted browser contexts.
  }
}
