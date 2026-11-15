import { useState } from 'react'
import { statuses } from '../data/demoData.js'
import { format } from 'date-fns'

const blankApplication = () => ({
  company: '', role: '', location: '', source: 'LinkedIn', status: 'Applied',
  appliedAt: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
  recruiter: '', recruiterEmail: '', notes: '', resumeId: '',
})

export default function ApplicationForm({ application, resumes, onCancel, onSave }) {
  const [values, setValues] = useState(() => application
    ? { ...application, appliedAt: format(new Date(application.appliedAt), "yyyy-MM-dd'T'HH:mm") }
    : blankApplication())
  const update = (key) => (event) => setValues((current) => ({ ...current, [key]: event.target.value }))

  function submit(event) {
    event.preventDefault()
    onSave({ ...values, appliedAt: new Date(values.appliedAt).toISOString() })
  }

  return (
    <form className="form-grid" onSubmit={submit}>
      <label className="field"><span>Company <b>*</b></span><input autoFocus required maxLength="80" value={values.company} onChange={update('company')} placeholder="e.g. Acme Inc." /></label>
      <label className="field"><span>Job title <b>*</b></span><input required maxLength="100" value={values.role} onChange={update('role')} placeholder="e.g. Product Designer" /></label>
      <label className="field"><span>Location</span><input maxLength="100" value={values.location} onChange={update('location')} placeholder="Remote or city" /></label>
      <label className="field"><span>Application date <b>*</b></span><input type="datetime-local" required value={values.appliedAt} onChange={update('appliedAt')} /></label>
      <label className="field"><span>Source</span><select value={values.source} onChange={update('source')}><option>LinkedIn</option><option>Company website</option><option>Referral</option><option>Wellfound</option><option>Career fair</option><option>Other</option></select></label>
      <label className="field"><span>Status</span><select value={values.status} onChange={update('status')}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>
      <label className="field"><span>Recruiter</span><input value={values.recruiter || ''} onChange={update('recruiter')} placeholder="Recruiter name" /></label>
      <label className="field"><span>Recruiter email</span><input type="email" value={values.recruiterEmail || ''} onChange={update('recruiterEmail')} placeholder="name@company.com" /></label>
      <label className="field field-full"><span>Linked resume</span><select value={values.resumeId || ''} onChange={update('resumeId')}><option value="">No resume linked</option>{resumes.map((resume) => <option value={resume.id} key={resume.id}>{resume.name}</option>)}</select></label>
      <label className="field field-full"><span>Notes</span><textarea rows="3" maxLength="1000" value={values.notes || ''} onChange={update('notes')} placeholder="Add a note to remember..." /></label>
      <div className="form-actions field-full"><button type="button" className="button button-secondary" onClick={onCancel}>Cancel</button><button type="submit" className="button button-primary">{application ? 'Save changes' : 'Add application'}</button></div>
    </form>
  )
}
