import { useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { eachDayOfInterval, format, isSameDay, parseISO, startOfDay, subDays } from 'date-fns'
import { ArrowDownRight, ArrowUpRight, BarChart3, BriefcaseBusiness, Target, TrendingUp } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import PageHeader from '../components/PageHeader.jsx'
import { statuses } from '../data/demoData.js'

const colors = { Wishlist: '#adb5c7', Applied: '#635bff', Interview: '#40a9e0', Offer: '#28b47e', Rejected: '#f37a84' }

export default function Analytics() {
  const { applications, interviews } = useOutletContext()
  const [today] = useState(() => startOfDay(new Date()))
  const statusData = statuses.map((name) => ({ name, value: applications.filter((item) => item.status === name).length, color: colors[name] })).filter((item) => item.value > 0)
  const weeklyData = eachDayOfInterval({ start: subDays(today, 6), end: today }).map((day) => ({
    day: format(day, 'EEE'),
    applications: applications.filter((item) => isSameDay(parseISO(item.appliedAt), day)).length,
    interviews: interviews.filter((item) => isSameDay(parseISO(item.date), day)).length,
  }))
  const interviewCount = applications.filter((item) => ['Interview', 'Offer'].includes(item.status)).length
  const offers = applications.filter((item) => item.status === 'Offer').length
  const interviewRate = applications.length ? Math.round((interviewCount / applications.length) * 100) : 0
  const offerRate = interviewCount ? Math.round((offers / interviewCount) * 100) : 0
  const successMetrics = [
    { title: 'Interview conversion', value: `${interviewRate}%`, note: `${interviewCount} of ${applications.length} applications`, icon: Target, tone: 'purple', trend: interviewRate ? 'Good pace' : 'Just getting started' },
    { title: 'Offer rate', value: `${offerRate}%`, note: `${offers} offer${offers === 1 ? '' : 's'} from ${interviewCount} interviews`, icon: TrendingUp, tone: 'green', trend: offers ? 'You’ve got this!' : 'Keep going' },
  ]

  return (
    <>
      <PageHeader eyebrow="YOUR PROGRESS, AT A GLANCE" title="Analytics" description="A clearer picture of your job search and what’s working." action={<Link to="/applications" className="button button-secondary"><BriefcaseBusiness size={16} /> View applications</Link>} />
      <div className="analytics-kpis"><article className="analytics-kpi"><span className="metric-icon purple"><BriefcaseBusiness size={18} /></span><span>Total applications</span><strong>{applications.length}</strong><small>Across {new Set(applications.map((item) => item.company)).size} companies</small></article><article className="analytics-kpi"><span className="metric-icon blue"><BarChart3 size={18} /></span><span>Interviews</span><strong>{interviewCount}</strong><small>Including offers</small></article>{successMetrics.map(({ title, value, note, icon: Icon, tone, trend }) => <article className="analytics-kpi" key={title}><span className={`metric-icon ${tone}`}><Icon size={18} /></span><span>{title}</span><strong>{value}</strong><small>{note} · {trend}</small></article>)}</div>
      <div className="analytics-charts">
        <section className="panel analytics-chart-panel"><div className="panel-heading"><div><h2>Application status</h2><p>Where your opportunities stand today</p></div><span className="chart-total">{applications.length} total</span></div>
          {statusData.length ? <div className="status-chart-wrap"><div className="status-pie"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={statusData} dataKey="value" nameKey="name" innerRadius={66} outerRadius={88} paddingAngle={4} stroke="none">{statusData.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip formatter={(value, name) => [`${value} applications`, name]} /></PieChart></ResponsiveContainer><div className="pie-center"><strong>{applications.length}</strong><span>applications</span></div></div><div className="status-legend">{statuses.map((status) => <div key={status}><span className="legend-key" style={{ backgroundColor: colors[status] }} /><span>{status}</span><strong>{applications.filter((item) => item.status === status).length}</strong><small>{applications.length ? Math.round((applications.filter((item) => item.status === status).length / applications.length) * 100) : 0}%</small></div>)}</div></div> : <div className="compact-empty">Add an application to see your status breakdown.</div>}
        </section>
        <section className="panel analytics-chart-panel weekly-chart-panel"><div className="panel-heading"><div><h2>Weekly activity</h2><p>Applications and interviews, last 7 days</p></div><span className="chart-period-label">Last 7 days</span></div><div className="weekly-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={weeklyData} barGap={5} margin={{ top: 8, right: 0, left: -24, bottom: 0 }}><CartesianGrid vertical={false} stroke="#edf0f5" /><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#9299a8', fontSize: 12 }} dy={10} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#9299a8', fontSize: 11 }} /><Tooltip /><Bar dataKey="applications" name="Applications" fill="#6558e8" radius={[4, 4, 0, 0]} maxBarSize={20} /><Bar dataKey="interviews" name="Interviews" fill="#49b4de" radius={[4, 4, 0, 0]} maxBarSize={20} /></BarChart></ResponsiveContainer></div><div className="chart-legend-row"><span><i className="legend-dot" /> Applications</span><span><i className="legend-dot legend-blue" /> Interviews</span></div></section>
      </div>
      <section className="panel analytics-insight"><span className="insight-icon"><TrendingUp size={19} /></span><div><strong>{interviewRate >= 25 ? 'Your applications are getting noticed' : 'Every application is a step forward'}</strong><p>{interviewRate >= 25 ? `You’re converting ${interviewRate}% of applications into interview opportunities. Keep nurturing the conversations you’ve started.` : 'Consistency is key. Keep tracking each application and following up thoughtfully to build momentum.'}</p></div><span className="insight-trend">{interviewRate > 0 ? <ArrowUpRight size={17} /> : <ArrowDownRight size={17} />}</span></section>
      <p className="demo-notice">Insights are calculated from your current demo applications and reset when you refresh.</p>
    </>
  )
}
