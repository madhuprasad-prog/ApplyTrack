import { useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { CalendarDays, ExternalLink, MapPin, Plus, Video } from 'lucide-react'
import { format, isPast, parseISO } from 'date-fns'
import PageHeader from '../components/PageHeader.jsx'
import Modal from '../components/Modal.jsx'
import { formatDate } from '../utils/format.js'

export default function Interviews() {
  const app = useOutletContext()
  const [showForm, setShowForm] = useState(false)
  const [now] = useState(() => new Date())
  const interviews = [...app.interviews].sort((a, b) => a.date.localeCompare(b.date))

  function submit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    app.addInterview({ applicationId: form.get('applicationId'), round: form.get('round').trim(), date: new Date(form.get('date')).toISOString(), mode: form.get('mode'), link: form.get('link').trim(), notes: form.get('notes').trim() })
    setShowForm(false)
  }

  return (
    <>
      <PageHeader eyebrow="MAKE YOUR BEST IMPRESSION" title="Interviews" description="Plan ahead and feel confident at every stage." action={<button className="button button-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Schedule interview</button>} />
      <div className="interview-summary"><div className="summary-icon"><CalendarDays size={18} /></div><div><strong>{interviews.filter((item) => !isPast(parseISO(item.date))).length} upcoming interviews</strong><span>across {new Set(interviews.map((item) => item.applicationId)).size} companies</span></div><Link to="/applications">View applications <span>→</span></Link></div>
      <section className="interview-list">
        {interviews.length ? interviews.map((interview) => {
          const application = app.applications.find((item) => item.id === interview.applicationId)
          const past = isPast(parseISO(interview.date))
          return <article className={`panel interview-card${past ? ' interview-past' : ''}`} key={interview.id}><div className="interview-date-block"><span>{formatDate(interview.date, 'EEE')}</span><strong>{formatDate(interview.date, 'd')}</strong><span>{formatDate(interview.date, 'MMM')}</span></div><div className="interview-card-content"><div className="interview-card-title"><div><span className="interview-company">{application?.company || 'Application removed'}</span><h2>{interview.round}</h2></div><span className={`interview-state ${past ? 'state-done' : ''}`}>{past ? 'Completed' : 'Upcoming'}</span></div><div className="interview-meta"><span><CalendarDays size={15} />{format(parseISO(interview.date), 'EEEE, MMMM d · h:mm a')}</span><span><Video size={15} />{interview.mode}</span>{application && <Link to={`/applications/${application.id}`}><MapPin size={15} />{application.role}</Link>}</div>{interview.notes && <p className="interview-notes">{interview.notes}</p>}</div>{interview.link && <a className="button button-secondary meeting-button" href={interview.link} target="_blank" rel="noreferrer"><ExternalLink size={15} /> Join meeting</a>}</article>
        }) : <div className="panel empty-state"><span className="empty-icon"><CalendarDays size={22} /></span><h3>No interviews scheduled</h3><p>Add an interview to keep all your rounds in one place.</p><button className="button button-primary" onClick={() => setShowForm(true)}><Plus size={16} /> Schedule interview</button></div>}
      </section>
      {showForm && <Modal title="Schedule an interview" description="Add the details so you’re ready for every round." onClose={() => setShowForm(false)}><form className="stacked-form" onSubmit={submit}><label className="field"><span>Application <b>*</b></span><select name="applicationId" required defaultValue=""><option value="" disabled>Select a company</option>{app.applications.map((item) => <option value={item.id} key={item.id}>{item.company} — {item.role}</option>)}</select></label><label className="field"><span>Interview round <b>*</b></span><input name="round" required maxLength="80" placeholder="e.g. Portfolio review" /></label><label className="field"><span>Date and time <b>*</b></span><input name="date" type="datetime-local" required min={format(now, "yyyy-MM-dd'T'HH:mm")} /></label><label className="field"><span>Interview type</span><select name="mode"><option>Video call</option><option>Phone</option><option>In person</option><option>Technical assessment</option></select></label><label className="field"><span>Meeting link</span><input name="link" type="url" placeholder="https://" /></label><label className="field"><span>Preparation notes</span><textarea name="notes" rows="3" maxLength="1000" placeholder="Topics to prepare..." /></label><div className="form-actions"><button type="button" className="button button-secondary" onClick={() => setShowForm(false)}>Cancel</button><button className="button button-primary" type="submit">Save interview</button></div></form></Modal>}
    </>
  )
}
