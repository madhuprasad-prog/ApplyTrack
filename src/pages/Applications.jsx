import { useMemo, useState } from 'react'
import { Link, useOutletContext, useSearchParams } from 'react-router-dom'
import { ArrowUpDown, BriefcaseBusiness, ChevronDown, LayoutGrid, List, MoreHorizontal, Plus, Search, SlidersHorizontal, Trash2 } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import ApplicationForm from '../components/ApplicationForm.jsx'
import Modal from '../components/Modal.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { statuses } from '../data/demoData.js'
import { formatDate } from '../utils/format.js'

export default function Applications() {
  const app = useOutletContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('search') || ''
  const [statusFilter, setStatusFilter] = useState('All statuses')
  const [sortBy, setSortBy] = useState('Newest first')
  const [view, setView] = useState('list')
  const [modal, setModal] = useState(null)
  const [menuId, setMenuId] = useState('')
  const [saving, setSaving] = useState(false)

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    return app.applications.filter((item) => (statusFilter === 'All statuses' || item.status === statusFilter) && (!term || [item.company, item.role, item.location, item.source].some((value) => value?.toLowerCase().includes(term))))
      .sort((a, b) => sortBy === 'Oldest first' ? a.appliedAt.localeCompare(b.appliedAt) : sortBy === 'Company A–Z' ? a.company.localeCompare(b.company) : b.appliedAt.localeCompare(a.appliedAt))
  }, [app.applications, query, sortBy, statusFilter])

  async function save(values) {
    setSaving(true)
    try {
      const saved = modal.type === 'edit'
        ? await app.updateApplication(modal.application.id, values)
        : await app.addApplication(values)
      if (saved) setModal(null)
    } finally {
      setSaving(false)
    }
  }
  async function deleteApplication(item) {
    if (window.confirm(`Delete your ${item.company} application? This cannot be undone.`)) {
      await app.removeApplication(item.id)
    }
    setMenuId('')
  }

  return (
    <>
      <PageHeader eyebrow="YOUR JOB SEARCH" title="Applications" description={`All your opportunities in one place. You’re tracking ${app.applications.length} applications.`} action={<button className="button button-primary" onClick={() => setModal({ type: 'add' })}><Plus size={16} /> Add application</button>} />
      <section className="panel applications-panel">
        {app.applicationsError && <div className="application-error" role="alert"><span>{app.applicationsError}</span><button className="button button-secondary" onClick={() => { void app.refreshApplications() }}>Retry</button></div>}
        <div className="applications-toolbar">
          <div className="toolbar-search"><Search size={16} /><input value={query} onChange={(event) => { const next = new URLSearchParams(searchParams); if (event.target.value) next.set('search', event.target.value); else next.delete('search'); setSearchParams(next, { replace: true }) }} placeholder="Search companies, roles..." aria-label="Search applications" /></div>
          <div className="toolbar-controls"><label className="select-control"><SlidersHorizontal size={15} /><select aria-label="Filter by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All statuses</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select><ChevronDown size={14} /></label><label className="select-control sort-control"><ArrowUpDown size={15} /><select aria-label="Sort applications" value={sortBy} onChange={(event) => setSortBy(event.target.value)}><option>Newest first</option><option>Oldest first</option><option>Company A–Z</option></select><ChevronDown size={14} /></label><div className="view-switch" role="group" aria-label="Choose applications view"><button className={view === 'list' ? 'selected' : ''} onClick={() => setView('list')} aria-label="List view"><List size={17} /></button><button className={view === 'board' ? 'selected' : ''} onClick={() => setView('board')} aria-label="Kanban view"><LayoutGrid size={17} /></button></div></div>
        </div>
        {app.applicationsLoading ? <div className="applications-loading" role="status">Loading your applications…</div> : view === 'list' ? <div className="table-scroll"><table className="applications-table"><thead><tr><th>COMPANY</th><th>ROLE</th><th>DATE APPLIED</th><th>STATUS</th><th>SOURCE</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>
          {filtered.map((item) => <tr key={item.id}><td><Link to={`/applications/${item.id}`} className="table-company"><span className="company-avatar" style={{ '--company-color': item.color }}>{item.company.slice(0, 1)}</span><strong>{item.company}</strong></Link></td><td><Link to={`/applications/${item.id}`} className="role-link"><strong>{item.role}</strong><small>{item.location || 'Location not set'}</small></Link></td><td>{formatDate(item.appliedAt)}</td><td><StatusBadge status={item.status} /></td><td>{item.source}</td><td><div className="row-menu-wrap"><button className="icon-button row-menu-button" onClick={() => setMenuId(menuId === item.id ? '' : item.id)} aria-label={`Actions for ${item.company}`}><MoreHorizontal size={18} /></button>{menuId === item.id && <div className="row-menu"><button onClick={() => { setModal({ type: 'edit', application: item }); setMenuId('') }}>Edit application</button><button className="danger-menu-item" onClick={() => deleteApplication(item)}><Trash2 size={14} /> Delete</button></div>}</div></td></tr>)}
        </tbody></table>{filtered.length === 0 && <div className="empty-state"><span className="empty-icon"><BriefcaseBusiness size={22} /></span><h3>No applications found</h3><p>Try adjusting your search or filters, or add a new application.</p><button className="button button-secondary" onClick={() => { const next = new URLSearchParams(searchParams); next.delete('search'); setSearchParams(next, { replace: true }); setStatusFilter('All statuses') }}>Clear filters</button></div>}</div>
          : <div className="kanban-board">{statuses.map((status) => {
            const cards = filtered.filter((item) => item.status === status)
            return <section className="kanban-column" key={status} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); const id = event.dataTransfer.getData('text/plain'); if (id) void app.changeStatus(id, status) }}><div className="kanban-column-heading"><span className={`column-dot dot-${status.toLowerCase()}`} /><h2>{status}</h2><span className="column-count">{cards.length}</span></div>{cards.map((item) => <article className="kanban-card" key={item.id} draggable onDragStart={(event) => event.dataTransfer.setData('text/plain', item.id)}><div className="kanban-card-top"><span className="company-avatar" style={{ '--company-color': item.color }}>{item.company.slice(0, 1)}</span><select aria-label={`Change ${item.company} status`} value={item.status} onChange={(event) => void app.changeStatus(item.id, event.target.value)}>{statuses.map((option) => <option key={option}>{option}</option>)}</select></div><Link to={`/applications/${item.id}`} className="kanban-card-title"><strong>{item.role}</strong><span>{item.company}</span></Link><div className="kanban-card-foot"><span>{item.location || 'Remote'}</span><span>{formatDate(item.appliedAt, 'MMM d')}</span></div></article>)}</section>
          })}</div>}
        {!app.applicationsLoading && <div className="table-footer"><span>Showing <strong>{filtered.length}</strong> of <strong>{app.applications.length}</strong> applications</span><span className="demo-label"><i /> Saved to your account</span></div>}
      </section>
      {modal && <Modal title={modal.type === 'edit' ? 'Edit application' : 'Add an application'} description={modal.type === 'edit' ? 'Update your opportunity details.' : 'Keep your job search organized in one place.'} wide onClose={() => { if (!saving) setModal(null) }}><ApplicationForm application={modal.application} resumes={app.resumes} saving={saving} onCancel={() => setModal(null)} onSave={save} /></Modal>}
    </>
  )
}
