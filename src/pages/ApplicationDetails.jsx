import { useState } from 'react'
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { ArrowLeft, BriefcaseBusiness, CalendarDays, ExternalLink, Mail, MapPin, Pencil, Plus, Trash2 } from 'lucide-react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import toast from 'react-hot-toast'
import ApplicationForm from '../components/ApplicationForm.jsx'
import Modal from '../components/Modal.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { formatDate } from '../utils/format.js'

export default function ApplicationDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const app = useOutletContext()
  const [editing, setEditing] = useState(false)
  const application = app.applications.find((item) => item.id === id)
  if (!application) return <div className="empty-page"><span className="empty-icon"><BriefcaseBusiness size={22} /></span><h2>Application not found</h2><p>It may have been removed from your demo workspace.</p><Link className="button button-primary" to="/applications">Back to applications</Link></div>

  const resume = app.resumes.find((item) => item.id === application.resumeId)
  const interviews = app.interviews.filter((item) => item.applicationId === id).sort((a, b) => b.date.localeCompare(a.date))
  const activity = (application.activity?.length ? [...application.activity] : [{ type: 'Application submitted', date: application.appliedAt }])
    .sort((a, b) => b.date.localeCompare(a.date))

  function remove() {
    if (window.confirm(`Delete your ${application.company} application?`)) {
      app.removeApplication(id)
      navigate('/applications')
    }
  }

  return (
    <>
      <Link to="/applications" className="back-link"><ArrowLeft size={16} /> All applications</Link>
      <section className="detail-hero panel"><span className="company-avatar company-avatar-large" style={{ '--company-color': application.color }}>{application.company.slice(0, 1)}</span><div className="detail-heading"><div className="detail-title-line"><h1>{application.role}</h1><StatusBadge status={application.status} /></div><p>{application.company}<span className="detail-bullet">·</span><MapPin size={14} />{application.location || 'Location not set'}</p></div><div className="detail-actions"><button className="button button-secondary" onClick={() => setEditing(true)}><Pencil size={15} /> Edit</button><button className="icon-button danger-icon" onClick={remove} aria-label="Delete application"><Trash2 size={17} /></button></div></section>
      <div className="details-grid">
        <div className="details-main">
          <section className="panel detail-section"><div className="section-title"><h2>Application activity</h2><span>{activity.length} updates</span></div><div className="timeline">{activity.map((event, index) => <div className={`timeline-item${index === 0 ? ' timeline-current' : ''}`} key={`${event.type}-${event.date}-${index}`}><span className="timeline-marker" /><div><strong>{event.type}</strong><p>{formatDate(event.date, 'MMM d, yyyy · h:mm a')}<span> · {formatDistanceToNow(parseISO(event.date), { addSuffix: true })}</span></p></div></div>)}</div></section>
          <section className="panel detail-section"><div className="section-title"><h2>Notes</h2><button className="quiet-button" onClick={() => { const notes = window.prompt('Update your notes', application.notes || ''); if (notes !== null) { app.updateApplication(id, { notes }); toast.success('Notes saved') } }}>Edit notes</button></div>{application.notes ? <p className="notes-copy">{application.notes}</p> : <div className="inline-empty">No notes yet. Add a note to remember important details.</div>}</section>
          <section className="panel detail-section"><div className="section-title"><h2>Interviews</h2><Link to="/interviews" className="quiet-button">Manage interviews</Link></div>{interviews.length ? interviews.map((interview) => <div className="detail-interview" key={interview.id}><span className="interview-icon"><CalendarDays size={17} /></span><div><strong>{interview.round}</strong><p>{formatDate(interview.date, 'EEEE, MMM d · h:mm a')} · {interview.mode}</p></div>{interview.link && <a className="icon-button" href={interview.link} target="_blank" rel="noreferrer" aria-label="Open meeting link"><ExternalLink size={16} /></a>}</div>) : <div className="inline-empty">No interviews scheduled yet.</div>}</section>
        </div>
        <aside className="details-aside">
          <section className="panel detail-section"><div className="section-title"><h2>Job details</h2></div><dl className="detail-facts"><div><dt>Applied on</dt><dd>{formatDate(application.appliedAt)}</dd></div><div><dt>Found via</dt><dd>{application.source}</dd></div><div><dt>Location</dt><dd>{application.location || 'Not specified'}</dd></div><div><dt>Resume</dt><dd>{resume ? resume.name : 'Not linked'}</dd></div></dl></section>
          <section className="panel detail-section"><div className="section-title"><h2>Recruiter</h2></div>{application.recruiter || application.recruiterEmail ? <div className="recruiter-card"><div className="user-avatar recruiter-avatar">{(application.recruiter || application.company).split(' ').map((word) => word[0]).slice(0, 2).join('').toUpperCase()}</div><div><strong>{application.recruiter || 'Recruiter'}</strong><small>{application.company}</small></div></div> : <div className="inline-empty">Recruiter details haven’t been added.</div>}{application.recruiterEmail && <a className="contact-link" href={`mailto:${application.recruiterEmail}`}><Mail size={15} />{application.recruiterEmail}</a>}</section>
          <section className="panel detail-section next-step-card"><div className="next-step-icon"><Plus size={17} /></div><h3>Keep things moving</h3><p>Set a reminder to follow up with {application.company}.</p><Link to="/follow-ups" className="button button-secondary button-full">View follow-ups</Link></section>
        </aside>
      </div>
      {editing && <Modal title="Edit application" description="Update your opportunity details." wide onClose={() => setEditing(false)}><ApplicationForm application={application} resumes={app.resumes} onCancel={() => setEditing(false)} onSave={(values) => { app.updateApplication(id, values); setEditing(false) }} /></Modal>}
    </>
  )
}
