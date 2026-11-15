import { useMemo, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { addDays, eachDayOfInterval, format, isSameDay, isWithinInterval, parseISO, startOfDay, subDays } from 'date-fns'
import { ArrowDownRight, ArrowRight, ArrowUpRight, BriefcaseBusiness, CalendarDays, Check, CircleDollarSign, CircleX, Clock3, Plus } from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import PageHeader from '../components/PageHeader.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { formatDate, relativeDay } from '../utils/format.js'

function ActivityTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return <div className="chart-tooltip"><strong>{label}</strong><span>{payload[0].value} applications</span></div>
}

export default function Dashboard() {
  const { applications, interviews, followups } = useOutletContext()
  const [today] = useState(() => startOfDay(new Date()))
  const weekStart = subDays(today, 6)
  const chartData = useMemo(() => eachDayOfInterval({ start: weekStart, end: today }).map((day) => ({
    day: format(day, 'EEE'),
    applications: applications.filter((item) => isSameDay(parseISO(item.appliedAt), day)).length,
  })), [applications, today, weekStart])
  const upcoming = interviews.filter((item) => parseISO(item.date) >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3)
  const recent = [...applications].sort((a, b) => b.appliedAt.localeCompare(a.appliedAt)).slice(0, 4)
  const metrics = [
    { label: 'Total applications', value: applications.length, icon: BriefcaseBusiness, tone: 'purple', detail: 'Keep your momentum going', trend: '+12%', down: false },
    { label: 'Interviews scheduled', value: interviews.filter((item) => parseISO(item.date) >= today).length, icon: CalendarDays, tone: 'blue', detail: 'Next one tomorrow', trend: '+2', down: false },
    { label: 'Offers received', value: applications.filter((item) => item.status === 'Offer').length, icon: CircleDollarSign, tone: 'green', detail: 'You’re doing great!', trend: '1 new', down: false },
    { label: 'Rejections', value: applications.filter((item) => item.status === 'Rejected').length, icon: CircleX, tone: 'orange', detail: 'Keep moving forward', trend: null, down: false },
  ]

  return (
    <>
      <PageHeader eyebrow="YOUR JOB SEARCH" title="Good afternoon, Sarah" description="Here’s what’s happening with your job search." action={<Link className="button button-primary" to="/applications"><Plus size={16} /> Add application</Link>} />
      <section className="metric-grid" aria-label="Application statistics">
        {metrics.map(({ label, value, icon: Icon, tone, detail, trend, down }) => <article className="metric-card" key={label}><div className="metric-top"><span className={`metric-icon ${tone}`}><Icon size={18} /></span>{trend && <span className={`metric-trend${down ? ' negative' : ''}`}>{down ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}{trend}</span>}</div><p>{label}</p><div className="metric-bottom"><strong>{value}</strong><span>{detail}</span></div></article>)}
      </section>
      <div className="dashboard-grid">
        <section className="panel activity-panel">
          <div className="panel-heading"><div><h2>Application activity</h2><p>Your progress over the last 7 days</p></div><span className="period-select">Last 7 days</span></div>
          <div className="activity-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 10, right: 6, left: -24, bottom: 0 }}><defs><linearGradient id="activityFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6558e8" stopOpacity={0.16} /><stop offset="95%" stopColor="#6558e8" stopOpacity={0} /></linearGradient></defs><CartesianGrid vertical={false} stroke="#edf0f5" /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#9299a8', fontSize: 12 }} dy={12} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#9299a8', fontSize: 11 }} /><Tooltip content={<ActivityTooltip />} /><Area type="monotone" dataKey="applications" stroke="#6558e8" strokeWidth={2.5} fill="url(#activityFill)" activeDot={{ r: 5, strokeWidth: 3, stroke: '#fff' }} /></AreaChart></ResponsiveContainer></div>
          <div className="chart-footnote"><span><i className="legend-dot" /> Applications sent</span><strong>{applications.filter((item) => isWithinInterval(parseISO(item.appliedAt), { start: weekStart, end: addDays(today, 1) })).length} this week</strong></div>
        </section>
        <section className="panel interview-panel">
          <div className="panel-heading"><div><h2>Upcoming interviews</h2><p>Be ready for what’s next</p></div><Link className="text-link" to="/interviews">View all <ArrowRight size={15} /></Link></div>
          {upcoming.length ? <div className="upcoming-list">{upcoming.map((interview) => {
            const company = applications.find((item) => item.id === interview.applicationId)
            return <article className="upcoming-item" key={interview.id}><div className="date-tile"><strong>{formatDate(interview.date, 'd')}</strong><span>{formatDate(interview.date, 'MMM')}</span></div><div className="upcoming-info"><strong>{interview.round}</strong><span>{company?.company || 'Application'} · {formatDate(interview.date, 'h:mm a')}</span><small><span className="meeting-dot" /> {interview.mode}</small></div><Link to="/interviews" className="mini-arrow" aria-label={`View ${interview.round}`}><ArrowRight size={16} /></Link></article>
          })}</div> : <div className="compact-empty"><CalendarDays size={20} /><span>No upcoming interviews yet</span></div>}
          <Link to="/interviews" className="panel-footer-link">Manage your interviews <ArrowRight size={15} /></Link>
        </section>
        <section className="panel recent-panel">
          <div className="panel-heading"><div><h2>Recent applications</h2><p>Stay on top of your latest opportunities</p></div><Link className="text-link" to="/applications">See all <ArrowRight size={15} /></Link></div>
          <div className="recent-list">{recent.map((application) => <Link className="recent-row" to={`/applications/${application.id}`} key={application.id}><span className="company-avatar" style={{ '--company-color': application.color }}>{application.company.slice(0, 1)}</span><span className="recent-company"><strong>{application.company}</strong><small>{application.role}</small></span><span className="recent-date">{relativeDay(application.appliedAt)}</span><StatusBadge status={application.status} /></Link>)}</div>
        </section>
        <section className="panel followup-panel">
          <div className="panel-heading"><div><h2>Follow-up reminders</h2><p>Little nudges make a big difference</p></div><Link className="text-link" to="/follow-ups">See all <ArrowRight size={15} /></Link></div>
          {followups.filter((item) => !item.completed).length ? <div className="reminder-list">{followups.filter((item) => !item.completed).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3).map((item) => {
            const company = applications.find((application) => application.id === item.applicationId)
            const overdue = parseISO(item.date) < today
            return <Link to="/follow-ups" className="reminder-row" key={item.id}><span className={`reminder-icon${overdue ? ' overdue' : ''}`}><Clock3 size={16} /></span><span><strong>{company?.company || 'Application'}</strong><small>{item.note}</small></span><span className={overdue ? 'reminder-overdue' : 'reminder-date'}>{relativeDay(item.date)}</span></Link>
          })}</div> : <div className="compact-empty"><Check size={20} /><span>You’re all caught up!</span></div>}
          <Link to="/follow-ups" className="panel-footer-link">View your follow-up list <ArrowRight size={15} /></Link>
        </section>
      </div>
    </>
  )
}
