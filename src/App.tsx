// TEMPLATE: Reusable Items workspace for a Power Apps Code App.
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { loadItems, saveItems } from './data/items'
import type { Item, ItemDraft, ItemStatus } from './data/items'
import './App.css'

const emptyDraft: ItemDraft = { name: '', category: '', status: 'Active', quantity: 1, owner: '' }
const statusOptions: ItemStatus[] = ['Active', 'In Use', 'On Hold', 'Archived']
type SortField = 'name' | 'category' | 'status' | 'quantity' | 'owner' | 'updatedAt'
type ViewName = 'table' | 'kanban' | 'timeline' | 'process' | 'calendar' | 'activity'
const pageSizeOptions = [10, 20, 50, 100]
const viewDetails: Record<ViewName, { title: string; subtitle: string; panelTitle: string; panelDescription: string }> = {
  table: { title: 'Items', subtitle: 'A simple starting point for tracking the things that matter to your team.', panelTitle: 'All items', panelDescription: 'Manage and organize your workspace items.' },
  kanban: { title: 'Kanban', subtitle: 'View workspace items grouped by status.', panelTitle: 'Items by status', panelDescription: 'Browse matching items across status columns.' },
  timeline: { title: 'Timeline', subtitle: 'See when workspace items were last updated.', panelTitle: 'Item timeline', panelDescription: 'Items are ordered by their latest update date.' },
  process: { title: 'Process', subtitle: 'See the stages items move through in this workspace.', panelTitle: 'Process flow', panelDescription: 'Select a stage to open its items in the table view.' },
  calendar: { title: 'Calendar', subtitle: 'See item updates by date.', panelTitle: 'Update calendar', panelDescription: 'Calendar entries use each item’s latest update date.' },
  activity: { title: 'Activity', subtitle: 'Review the latest update recorded for each item.', panelTitle: 'Recent activity', panelDescription: 'This template stores each item’s current updated date, not a full change log.' },
}

function App() {
  const [items, setItems] = useState<Item[]>(loadItems)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All statuses')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [activeView, setActiveView] = useState<ViewName>('table')
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const viewDetail = viewDetails[activeView]
  const [draft, setDraft] = useState<ItemDraft>(emptyDraft)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => saveItems(items), [items])

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    return items.filter((item) => {
      const matchesStatus = statusFilter === 'All statuses' || item.status === statusFilter
      const matchesQuery = !normalizedQuery || [item.name, item.category, item.owner].join(' ').toLocaleLowerCase().includes(normalizedQuery)
      return matchesStatus && matchesQuery
    })
  }, [items, query, statusFilter])

  const sortedItems = useMemo(() => [...filteredItems].sort((a, b) => {
    const left = a[sortField]
    const right = b[sortField]
    const comparison = typeof left === 'number' && typeof right === 'number'
      ? left - right
      : String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: 'base' })
    return sortDirection === 'asc' ? comparison : -comparison
  }), [filteredItems, sortDirection, sortField])
  const pageCount = Math.max(1, Math.ceil(sortedItems.length / pageSize))
  const currentPage = Math.min(page, pageCount - 1)
  const visibleItems = sortedItems.slice(currentPage * pageSize, (currentPage + 1) * pageSize)
  const hasActiveFilters = query.trim().length > 0 || statusFilter !== 'All statuses'
  const firstVisible = sortedItems.length ? currentPage * pageSize + 1 : 0
  const lastVisible = Math.min((currentPage + 1) * pageSize, sortedItems.length)

  function sortBy(field: SortField) {
    if (sortField === field) setSortDirection((direction) => direction === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDirection('asc') }
    setPage(0)
  }

  function sortHeading(field: SortField, label: string) {
    const active = sortField === field
    const marker = active ? (sortDirection === 'asc' ? '↑' : '↓') : '↕'
    return <button className={'sort-button' + (active ? ' sorted' : '')} type="button" onClick={() => sortBy(field)} aria-label={`Sort by ${label}, ${active && sortDirection === 'asc' ? 'descending' : 'ascending'}`}>{label}<span aria-hidden="true">{marker}</span></button>
  }

  function clearFilters() {
    setQuery('')
    setStatusFilter('All statuses')
    setPage(0)
  }

  const dateSortedItems = [...sortedItems].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  const calendarYear = calendarMonth.getFullYear()
  const calendarMonthIndex = calendarMonth.getMonth()
  const calendarDayCount = new Date(calendarYear, calendarMonthIndex + 1, 0).getDate()
  const calendarOffset = new Date(calendarYear, calendarMonthIndex, 1).getDay()
  const monthLabel = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(calendarMonth)

  function renderTimeline() {
    return <><div className="timeline-list">{dateSortedItems.map((item) => <button className="timeline-entry" type="button" key={item.id} onClick={() => openEditItem(item)}><span className={'timeline-marker status-dot-' + item.status.toLocaleLowerCase().replaceAll(' ', '-') } /><time>{formatDate(item.updatedAt)}</time><div className="timeline-entry-card"><div className="timeline-entry-heading"><strong>{item.name}</strong><span className={'status-badge status-' + item.status.toLocaleLowerCase().replaceAll(' ', '-') }><i />{item.status}</span></div><p>{item.category || 'Uncategorized'} <span>·</span> Owner: {item.owner || 'Unassigned'}</p></div></button>)}</div><div className="panel-footer"><span>Showing {dateSortedItems.length} matching {dateSortedItems.length === 1 ? 'item' : 'items'} by update date</span><span className="local-indicator"><i /> Dates reflect the latest update</span></div></>
  }

  function renderProcess() {
    return <><div className="process-flow">{statusOptions.map((status, index) => {
      const count = sortedItems.filter((item) => item.status === status).length
      return <div className="process-stage-wrap" key={status}><button className="process-stage" type="button" onClick={() => { setStatusFilter(status); setPage(0); setActiveView('table') }}><span className={'status-dot status-dot-' + status.toLocaleLowerCase().replaceAll(' ', '-') } /><span className="process-step">STEP {index + 1}</span><strong>{status}</strong><span className="process-stage-count">{count} {count === 1 ? 'item' : 'items'}</span><span className="process-stage-link">View items →</span></button>{index < statusOptions.length - 1 && <span className="process-connector" aria-hidden="true">→</span>}</div>
    })}</div><div className="panel-footer"><span>Process order: {statusOptions.join(' → ')}</span><span className="local-indicator"><i /> Select a stage to filter items</span></div></>
  }

  function renderCalendar() {
    const matchingDates = new Map<string, Item[]>()
    sortedItems.forEach((item) => {
      const date = new Date(item.updatedAt + 'T00:00:00')
      if (date.getFullYear() === calendarYear && date.getMonth() === calendarMonthIndex) {
        const key = item.updatedAt
        matchingDates.set(key, [...(matchingDates.get(key) || []), item])
      }
    })
    return <><div className="calendar-toolbar"><button type="button" className="calendar-month-button" onClick={() => setCalendarMonth(new Date(calendarYear, calendarMonthIndex - 1, 1))} aria-label="Previous month">‹</button><h3>{monthLabel}</h3><button type="button" className="calendar-month-button" onClick={() => setCalendarMonth(new Date(calendarYear, calendarMonthIndex + 1, 1))} aria-label="Next month">›</button></div><div className="calendar-grid">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <div className="calendar-weekday" key={day}>{day}</div>)}{Array.from({ length: calendarOffset }, (_, index) => <div className="calendar-day calendar-day-empty" key={'empty-' + index} />)}{Array.from({ length: calendarDayCount }, (_, index) => {
      const day = index + 1
      const key = `${calendarYear}-${String(calendarMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dayItems = matchingDates.get(key) || []
      return <div className="calendar-day" key={key}><span className="calendar-date">{day}</span><div className="calendar-day-items">{dayItems.map((item) => <button className="calendar-item" type="button" key={item.id} onClick={() => openEditItem(item)} title={item.name}><span className={'status-dot status-dot-' + item.status.toLocaleLowerCase().replaceAll(' ', '-') } />{item.name}</button>)}</div></div>
    })}</div><div className="panel-footer"><span>{matchingDates.size ? [...matchingDates.values()].reduce((count, dayItems) => count + dayItems.length, 0) : 0} matching items updated this month</span><span className="local-indicator"><i /> Dates reflect the latest update</span></div></>
  }

  function renderActivity() {
    return <><div className="activity-list">{dateSortedItems.map((item) => <button className="activity-entry" type="button" key={item.id} onClick={() => openEditItem(item)}><span className="activity-avatar">{item.name.slice(0, 1).toLocaleUpperCase() || 'I'}</span><span className="activity-content"><strong>{item.name}</strong><span>Item updated · {item.status} · {item.category || 'Uncategorized'}</span></span><time>{formatDate(item.updatedAt)}</time><span className="activity-arrow" aria-hidden="true">→</span></button>)}</div><div className="panel-footer"><span>{dateSortedItems.length} latest item updates</span><span className="local-indicator"><i /> Full change history is not stored in this template</span></div></>
  }

  const activeCount = items.filter((item) => item.status === 'Active').length
  const categoriesCount = new Set(items.map((item) => item.category.trim()).filter(Boolean)).size
  const totalQuantity = items.reduce((total, item) => total + item.quantity, 0)

  function notify(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 2800)
  }

  function openNewItem() {
    setDraft(emptyDraft)
    setEditingId(null)
    setFormOpen(true)
  }

  function openEditItem(item: Item) {
    const { name, category, status, quantity, owner } = item
    setDraft({ name, category, status, quantity, owner })
    setEditingId(item.id)
    setFormOpen(true)
  }

  function saveItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const now = new Date().toISOString().slice(0, 10)
    if (editingId) {
      setItems((current) => current.map((item) => item.id === editingId ? { ...item, ...draft, updatedAt: now } : item))
      notify('Item updated.')
    } else {
      const item: Item = { ...draft, id: crypto.randomUUID(), updatedAt: now }
      setItems((current) => [item, ...current])
      notify('Item added.')
    }
    setFormOpen(false)
  }

  function deleteItem(id: string) {
    setItems((current) => current.filter((item) => item.id !== id))
    notify('Item removed.')
  }

  function moveItemForward(id: string) {
    const now = new Date().toISOString().slice(0, 10)
    setItems((current) => current.map((item) => {
      if (item.id !== id) return item
      const nextStatus = statusOptions[statusOptions.indexOf(item.status) + 1]
      return nextStatus ? { ...item, status: nextStatus, updatedAt: now } : item
    }))
    notify('Item moved to the next status.')
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-copy"><img className="takeda-logo" src="/takeda-logo.png" alt="Takeda" /><strong>Code App</strong><span>STARTER TEMPLATE</span></div>
        <div className="sidebar-divider" />
        <p className="nav-label">WORKSPACE</p>
        <button className={'nav-item' + (activeView === 'table' ? ' active' : '')} type="button" onClick={() => setActiveView('table')} aria-current={activeView === 'table' ? 'page' : undefined}><span aria-hidden="true">▦</span> Items <span className="nav-count">{items.length}</span></button>
        <button className={'nav-item' + (activeView === 'kanban' ? ' active' : '')} type="button" onClick={() => setActiveView('kanban')} aria-current={activeView === 'kanban' ? 'page' : undefined}><span aria-hidden="true">▤</span> Kanban</button>
        <button className={'nav-item' + (activeView === 'timeline' ? ' active' : '')} type="button" onClick={() => setActiveView('timeline')} aria-current={activeView === 'timeline' ? 'page' : undefined}><span aria-hidden="true">↗</span> Timeline</button>
        <button className={'nav-item' + (activeView === 'process' ? ' active' : '')} type="button" onClick={() => setActiveView('process')} aria-current={activeView === 'process' ? 'page' : undefined}><span aria-hidden="true">⇢</span> Process</button>
        <button className={'nav-item' + (activeView === 'calendar' ? ' active' : '')} type="button" onClick={() => setActiveView('calendar')} aria-current={activeView === 'calendar' ? 'page' : undefined}><span aria-hidden="true">▣</span> Calendar</button>
        <button className={'nav-item' + (activeView === 'activity' ? ' active' : '')} type="button" onClick={() => setActiveView('activity')} aria-current={activeView === 'activity' ? 'page' : undefined}><span aria-hidden="true">◷</span> Activity</button>
        <div className="sidebar-note"><span className="note-icon" aria-hidden="true">✦</span><div><strong>Template area</strong><p>Use this workspace as a starting point for your own Items app.</p></div></div>
        <div className="sidebar-bottom"><span className="avatar">CA</span><div><strong>Workspace user</strong><small>Code App template</small></div><span className="more-icon" aria-hidden="true">···</span></div>
      </aside>

      <main className="main-area">
        <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <strong>{viewDetail.title}</strong></div><div className="topbar-right"><span className="template-chip"><i /> Template</span><button className="help-button" type="button" aria-label="Template information">?</button><span className="avatar top-avatar">CA</span></div></header>
        <section className="page-content">
          <div className="page-heading"><div><p className="eyebrow">WORKSPACE OVERVIEW</p><h1>{viewDetail.title}</h1><p className="subtitle">{viewDetail.subtitle}</p></div><button className="primary-button" type="button" onClick={openNewItem}><span aria-hidden="true">＋</span> Add item</button></div>

          <section className="stats-grid" aria-label="Items summary">
            <article className="stat-card"><div className="stat-top"><span>Total items</span><span className="stat-icon indigo">▦</span></div><strong>{items.length}</strong><small>Items in this workspace</small></article>
            <article className="stat-card"><div className="stat-top"><span>Active items</span><span className="stat-icon green">◉</span></div><strong>{activeCount}</strong><small>Ready to use</small></article>
            <article className="stat-card"><div className="stat-top"><span>Categories</span><span className="stat-icon amber">◇</span></div><strong>{categoriesCount}</strong><small>Distinct item groups</small></article>
            <article className="stat-card"><div className="stat-top"><span>Total quantity</span><span className="stat-icon blue">≡</span></div><strong>{totalQuantity}</strong><small>Across all items</small></article>
          </section>

          <section className="items-panel">
            <div className="panel-header"><div><h2>{viewDetail.panelTitle}</h2><p>{viewDetail.panelDescription}</p></div><span className="result-count">{sortedItems.length} {sortedItems.length === 1 ? 'item' : 'items'}</span></div>
            <div className="toolbar"><label className="search-box"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(0) }} placeholder="Search items..." aria-label="Search items" /></label><label className="filter-select"><span className="sr-only">Filter by status</span><select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(0) }}><option>All statuses</option>{statusOptions.map((status) => <option key={status}>{status}</option>)}</select></label>{hasActiveFilters && <button className="clear-filters" type="button" onClick={clearFilters}>Clear filters</button>}<button className="secondary-button" type="button" onClick={openNewItem}>＋ New item</button></div>
            {activeView === 'table' ? <><div className="table-wrap"><table><thead><tr><th>{sortHeading('name', 'ITEM')}</th><th>{sortHeading('category', 'CATEGORY')}</th><th>{sortHeading('status', 'STATUS')}</th><th>{sortHeading('quantity', 'QUANTITY')}</th><th>{sortHeading('owner', 'OWNER')}</th><th>{sortHeading('updatedAt', 'UPDATED')}</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>
              {visibleItems.map((item) => <tr key={item.id}><td><div className="item-cell"><span className="item-icon">{item.name.slice(0, 1).toLocaleUpperCase() || 'I'}</span><strong>{item.name}</strong></div></td><td><span className="category-chip">{item.category || 'Uncategorized'}</span></td><td><span className={'status-badge status-' + item.status.toLocaleLowerCase().replaceAll(' ', '-') }><i />{item.status}</span></td><td>{item.quantity}</td><td>{item.owner || 'Unassigned'}</td><td>{formatDate(item.updatedAt)}</td><td><div className="row-actions"><button type="button" onClick={() => openEditItem(item)} aria-label={'Edit ' + item.name}>Edit</button><button type="button" className="delete-action" onClick={() => deleteItem(item.id)} aria-label={'Remove ' + item.name}>Remove</button></div></td></tr>)}
              {visibleItems.length === 0 && <tr><td colSpan={7}><div className="empty-state"><span>⌕</span><strong>No items found</strong><p>Try another search or add a new item to this workspace.</p><button className="secondary-button" type="button" onClick={openNewItem}>Add your first item</button></div></td></tr>}
            </tbody></table></div><div className="panel-footer"><span>Showing {firstVisible}–{lastVisible} of {sortedItems.length} items</span><div className="footer-right"><label className="page-size-picker">Rows per page<select aria-label="Rows per page" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(0) }}>{pageSizeOptions.map((size) => <option key={size} value={size}>{size}</option>)}</select></label><div className="pagination" aria-label="Items pages"><button type="button" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 0} aria-label="Previous page">‹</button><span>Page {currentPage + 1} of {pageCount}</span><button type="button" onClick={() => setPage(currentPage + 1)} disabled={currentPage >= pageCount - 1} aria-label="Next page">›</button></div><span className="local-indicator"><i /> Demo data saved in this browser</span></div></div></> : activeView === 'kanban' ? <><div className="kanban-board">{statusOptions.map((status) => {
              const columnItems = sortedItems.filter((item) => item.status === status)
              return <section className="kanban-column" key={status} aria-label={`${status}: ${columnItems.length} items`}><div className="kanban-column-header"><span className={'status-dot status-dot-' + status.toLocaleLowerCase().replaceAll(' ', '-') } /><h3>{status}</h3><span className="kanban-count">{columnItems.length}</span></div><div className="kanban-cards">{columnItems.map((item) => { const nextStatus = statusOptions[statusOptions.indexOf(item.status) + 1]; return <article className="kanban-card" key={item.id} role="button" tabIndex={0} aria-label={`Edit ${item.name}`} onClick={() => openEditItem(item)} onKeyDown={(event) => { if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); openEditItem(item) } }}><div className="kanban-card-top"><span className="category-chip">{item.category || 'Uncategorized'}</span><span className="kanban-quantity">Qty {item.quantity}</span></div><h4>{item.name}</h4><p className="kanban-owner">Owner <strong>{item.owner || 'Unassigned'}</strong></p><div className="kanban-card-footer"><span>Updated {formatDate(item.updatedAt)}</span><button className="kanban-move-button" type="button" disabled={!nextStatus} onClick={(event) => { event.stopPropagation(); moveItemForward(item.id) }} aria-label={nextStatus ? `Move ${item.name} to ${nextStatus}` : `${item.name} is in the final status`}>{nextStatus ? `Move to ${nextStatus} →` : 'Final status'}</button></div></article> })}{columnItems.length === 0 && <div className="kanban-empty">No matching items</div>}</div></section>
            })}</div><div className="panel-footer"><span>Showing all {sortedItems.length} matching {sortedItems.length === 1 ? 'item' : 'items'}</span><span className="local-indicator"><i /> Demo data saved in this browser</span></div></> : activeView === 'timeline' ? renderTimeline() : activeView === 'process' ? renderProcess() : activeView === 'calendar' ? renderCalendar() : renderActivity()}
          </section>
          <footer className="app-footer">Code App template <span>•</span> Items workspace starter</footer>
        </section>
      </main>

      {formOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setFormOpen(false) }}><section className="item-modal" role="dialog" aria-modal="true" aria-labelledby="form-title"><div className="modal-header"><div><p className="eyebrow">TEMPLATE FORM</p><h2 id="form-title">{editingId ? 'Edit item' : 'Add item'}</h2><p>Update the general fields to match your use case.</p></div><button className="close-button" type="button" onClick={() => setFormOpen(false)} aria-label="Close form">×</button></div><form onSubmit={saveItem}><label>Item name<input required autoFocus value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="Enter an item name" /></label><div className="form-row"><label>Category<input value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} placeholder="e.g. General" /></label><label>Status<select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as ItemStatus })}>{statusOptions.map((status) => <option key={status}>{status}</option>)}</select></label></div><div className="form-row"><label>Quantity<input type="number" min="0" step="1" value={draft.quantity} onChange={(event) => setDraft({ ...draft, quantity: Number(event.target.value) })} /></label><label>Owner<input value={draft.owner} onChange={(event) => setDraft({ ...draft, owner: event.target.value })} placeholder="Team or person" /></label></div><div className="form-actions"><button className="secondary-button" type="button" onClick={() => setFormOpen(false)}>Cancel</button><button className="primary-button" type="submit">{editingId ? 'Save changes' : 'Add item'}</button></div></form></section></div>}
      {toast && <div className="toast" role="status"><span>✓</span>{toast}</div>}
    </div>
  )
}

function formatDate(value: string) {
  if (!value) return '—'
  const date = new Date(value + 'T00:00:00')
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' }).format(date)
}

export default App
