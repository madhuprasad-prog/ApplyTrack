import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Activity, Bell, BriefcaseBusiness, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, LayoutDashboard, Menu, Plus, Search, Settings2, Sparkles, StickyNote, X } from 'lucide-react'
import toast from 'react-hot-toast'
import ApplicationForm from '../components/ApplicationForm.jsx'
import Modal from '../components/Modal.jsx'

const mainLinks = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/applications', label: 'Applications', icon: BriefcaseBusiness },
  { to: '/interviews', label: 'Interviews', icon: CalendarDays },
  { to: '/follow-ups', label: 'Follow-ups', icon: StickyNote },
]
const manageLinks = [
  { to: '/resumes', label: 'Resume vault', icon: Settings2 },
  { to: '/analytics', label: 'Analytics', icon: Activity },
]
const pageNames = { '/': 'Overview', '/applications': 'Applications', '/interviews': 'Interviews', '/follow-ups': 'Follow-ups', '/resumes': 'Resume vault', '/analytics': 'Analytics' }

export default function AppLayout({ app }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const pageName = location.pathname.startsWith('/applications/') ? 'Application details' : pageNames[location.pathname] || 'Overview'
  useEffect(() => {
    const handler = () => setAddOpen(true)
    window.addEventListener('applytrack:add-application', handler)
    return () => window.removeEventListener('applytrack:add-application', handler)
  }, [])

  return (
    <div className={`app-shell${collapsed ? ' sidebar-collapsed' : ''}`}>
      {mobileOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar${mobileOpen ? ' sidebar-mobile-open' : ''}`}>
        <div className="brand-row">
          <div className="brand-mark"><Activity size={20} strokeWidth={2.6} /></div>
          {!collapsed && <span className="brand-name">applytrack<span>.</span></span>}
          <button className="sidebar-collapse icon-button" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} onClick={() => setCollapsed(!collapsed)}>{collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}</button>
          <button className="mobile-close icon-button" aria-label="Close navigation" onClick={() => setMobileOpen(false)}><X size={18} /></button>
        </div>
        <div className="workspace-switch"><span className="workspace-avatar">S</span>{!collapsed && <><span className="workspace-name">Sarah's workspace<small>Free plan</small></span><ChevronDown size={15} /></>}</div>
        <p className="nav-caption">{!collapsed && 'WORKSPACE'}</p>
        <nav className="nav-list" aria-label="Main navigation">
          {mainLinks.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} title={label} aria-label={label} onClick={() => setMobileOpen(false)} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}><Icon size={18} /><span>{label}</span>{label === 'Follow-ups' && !collapsed && <i className="nav-count">{app.followups.filter((item) => !item.completed).length}</i>}</NavLink>)}
        </nav>
        <p className="nav-caption nav-caption-spaced">{!collapsed && 'YOUR TOOLS'}</p>
        <nav className="nav-list" aria-label="Tools">
          {manageLinks.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} title={label} aria-label={label} onClick={() => setMobileOpen(false)} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}><Icon size={18} /><span>{label}</span></NavLink>)}
        </nav>
        {!collapsed && <div className="sidebar-tip"><div className="tip-icon"><Sparkles size={16} /></div><strong>Small steps add up</strong><p>You’re building momentum. Keep your applications moving.</p><div className="tip-progress"><span /></div><small>{app.applications.length} applications tracked</small></div>}
        <div className="sidebar-bottom">
          <a className="nav-link" href="mailto:hello@applytrack.app" title="Help & support" aria-label="Help & support"><CircleHelp size={18} /><span>Help & support</span></a>
          <div className="sidebar-user"><div className="user-avatar">SC</div>{!collapsed && <div className="user-meta"><strong>Sarah Chen</strong><small>Student plan</small></div>}{!collapsed && <button aria-label="Open profile menu" className="profile-more icon-button" onClick={() => setProfileOpen(!profileOpen)}><ChevronDown size={16} /></button>}</div>
          {profileOpen && <div className="profile-popover"><strong>Sarah Chen</strong><span>sarah.chen@email.com</span><button onClick={() => { setProfileOpen(false); toast('Profile settings are coming soon in this frontend demo.') }}>Profile settings</button></div>}
        </div>
      </aside>
      <main className="main-panel">
        <header className="topbar">
          <div className="topbar-left"><button className="mobile-menu icon-button" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu size={20} /></button><div className="breadcrumbs"><span>Workspace</span><span className="breadcrumb-separator">/</span><strong>{pageName}</strong></div></div>
          <div className="topbar-actions"><label className="global-search"><Search size={16} /><input placeholder="Search anything..." aria-label="Search anything" onKeyDown={(event) => { if (event.key === 'Enter' && event.currentTarget.value.trim()) navigate(`/applications?search=${encodeURIComponent(event.currentTarget.value.trim())}`) }} /><kbd>⌘ K</kbd></label><button className="icon-button notification-button" aria-label="Open follow-ups" onClick={() => navigate('/follow-ups')}><Bell size={18} /><i /></button><button className="topbar-add button button-primary" aria-label="Add application" onClick={() => setAddOpen(true)}><Plus size={16} /><span>Add application</span></button></div>
        </header>
        <div className="page-content"><Outlet context={app} /></div>
      </main>
      {addOpen && <Modal title="Add an application" description="Keep your job search organized in one place." wide onClose={() => setAddOpen(false)}><ApplicationForm resumes={app.resumes} onCancel={() => setAddOpen(false)} onSave={(values) => { app.addApplication(values); setAddOpen(false); navigate('/applications') }} /></Modal>}
    </div>
  )
}
