import { useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { addDays, format, isBefore, parseISO, startOfDay } from 'date-fns'
import { BellRing, CalendarClock, Check, CheckCheck, Circle, Plus } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import Modal from '../components/Modal.jsx'
import { relativeDay } from '../utils/format.js'

export default function Followups() {
  const app = useOutletContext()
  const [showForm, setShowForm] = useState(false)
  const [today] = useState(() => startOfDay(new Date()))
  const active = app.followups.filter((item) => !item.completed).sort((a, b) => a.date.localeCompare(b.date))
  const overdue = active.filter((item) => isBefore(parseISO(item.date), today))
  const upcoming = active.filter((item) => !isBefore(parseISO(item.date), today))
  const completed = app.followups.filter((item) => item.completed)

  function submit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    app.addFollowup({ applicationId: form.get('applicationId'), date: new Date(`${form.get('date')}T12:00:00`).toISOString(), note: form.get('note').trim() })
    setShowForm(false)
  }

  function renderItem(item) {
    const application = app.applications.find((candidate) => candidate.id === item.applicationId)
    return <article className={`followup-item${item.completed ? ' followup-completed' : ''}`} key={item.id}><button className={`complete-followup${item.completed ? ' checked' : ''}`} aria-label={item.completed ? 'Mark follow-up incomplete' : 'Mark follow-up complete'} onClick={() => app.toggleFollowup(item.id)}>{item.completed ? <Check size={14} /> : <Circle size={18} />}</button><div className="followup-copy"><strong>{item.note}</strong><span>{application ? <Link to={`/applications/${application.id}`}>{application.company} · {application.role}</Link> : 'Application removed'}</span></div><span className={`followup-due${!item.completed && isBefore(parseISO(item.date), today) ? ' overdue-text' : ''}`}><CalendarClock size={14} />{relativeDay(item.date)}</span></article>
  }

  return (
    <>
      <PageHeader eyebrow="STAY ON THEIR RADAR" title="Follow-ups" description="A thoughtful follow-up can make all the difference." action={<button className="button button-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Add reminder</button>} />
      <div className="followup-overview"><div className="followup-overview-icon"><BellRing size={18} /></div><div><strong>{active.length === 0 ? 'You’re all caught up!' : `${active.length} reminders to take care of`}</strong><span>{overdue.length ? `${overdue.length} overdue · ` : ''}{upcoming.length} upcoming</span></div><div className="followup-progress"><span style={{ width: `${app.followups.length ? (completed.length / app.followups.length) * 100 : 0}%` }} /></div><small>{completed.length} completed</small></div>
      {overdue.length > 0 && <section className="panel followup-section"><div className="followup-section-heading"><div className="section-icon overdue-section-icon"><BellRing size={17} /></div><div><h2>Needs your attention</h2><p>{overdue.length} overdue {overdue.length === 1 ? 'reminder' : 'reminders'}</p></div></div><div className="followup-list">{overdue.map(renderItem)}</div></section>}
      <section className="panel followup-section"><div className="followup-section-heading"><div className="section-icon"><CalendarClock size={17} /></div><div><h2>Coming up</h2><p>Follow-ups you’ve planned</p></div></div>{upcoming.length ? <div className="followup-list">{upcoming.map(renderItem)}</div> : <div className="inline-empty">No upcoming reminders. Add one to stay in touch.</div>}</section>
      {completed.length > 0 && <section className="panel followup-section"><div className="followup-section-heading"><div className="section-icon complete-section-icon"><CheckCheck size={17} /></div><div><h2>Completed</h2><p>Nice work keeping things moving</p></div></div><div className="followup-list">{completed.map(renderItem)}</div></section>}
      {showForm && <Modal title="Add a follow-up" description="Set a reminder for your next check-in." onClose={() => setShowForm(false)}><form className="stacked-form" onSubmit={submit}><label className="field"><span>Application <b>*</b></span><select name="applicationId" required defaultValue=""><option value="" disabled>Select a company</option>{app.applications.map((item) => <option value={item.id} key={item.id}>{item.company} — {item.role}</option>)}</select></label><label className="field"><span>Reminder <b>*</b></span><input name="note" required maxLength="160" placeholder="e.g. Send a thank-you note" /></label><label className="field"><span>Remind me on <b>*</b></span><input name="date" type="date" required min={format(today, 'yyyy-MM-dd')} defaultValue={format(addDays(today, 1), 'yyyy-MM-dd')} /></label><div className="form-actions"><button type="button" className="button button-secondary" onClick={() => setShowForm(false)}>Cancel</button><button className="button button-primary" type="submit">Add reminder</button></div></form></Modal>}
    </>
  )
}
