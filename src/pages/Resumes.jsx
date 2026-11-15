import { useRef, useState } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { FileText, FolderOpen, Plus, UploadCloud } from 'lucide-react'
import toast from 'react-hot-toast'
import PageHeader from '../components/PageHeader.jsx'
import { formatDate } from '../utils/format.js'

export default function Resumes() {
  const { resumes, addResume, applications } = useOutletContext()
  const inputRef = useRef(null)
  const [category, setCategory] = useState('All resumes')

  function upload(event) {
    const file = event.target.files?.[0]
    if (!file) return
    const validType = /\.(pdf|doc|docx)$/i.test(file.name)
    if (!validType) {
      toast.error('Choose a PDF, DOC or DOCX file.')
      event.target.value = ''
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Your resume must be smaller than 10 MB.')
      event.target.value = ''
      return
    }
    addResume({ name: file.name.replace(/\.[^.]+$/, ''), category: 'Recently added', size: `${Math.max(1, Math.round(file.size / 1024))} KB` })
    event.target.value = ''
  }

  const categories = ['All resumes', ...new Set(resumes.map((resume) => resume.category))]
  const visible = category === 'All resumes' ? resumes : resumes.filter((resume) => resume.category === category)

  return (
    <>
      <PageHeader eyebrow="YOUR DOCUMENTS" title="Resume vault" description="Keep every version organized and ready for the right opportunity." action={<><input ref={inputRef} className="visually-hidden" type="file" accept=".pdf,.doc,.docx" onChange={upload} /><button className="button button-primary" onClick={() => inputRef.current?.click()}><UploadCloud size={16} /> Upload resume</button></>} />
      <section className="resume-upload-panel"><div className="upload-illustration"><UploadCloud size={23} /></div><div className="upload-copy"><strong>One great resume, many opportunities</strong><span>Upload PDF or Word documents up to 10 MB. Files are listed for this demo only and aren’t stored.</span></div><button className="button button-secondary" onClick={() => inputRef.current?.click()}><Plus size={15} /> Add a resume</button></section>
      <section className="resume-library"><div className="library-heading"><div><h2>Your resumes <span>{resumes.length}</span></h2><p>Choose the right version for each application.</p></div><label className="select-control"><FolderOpen size={15} /><select aria-label="Filter resumes by category" value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label></div>
        {visible.length ? <div className="resume-grid">{visible.map((resume) => {
          const linked = applications.filter((application) => application.resumeId === resume.id)
          return <article className="panel resume-card" key={resume.id}><div className="resume-card-top"><span className="resume-file-icon"><FileText size={20} /></span><span className="resume-file-type">DOCUMENT</span></div><h3>{resume.name}</h3><span className="resume-category">{resume.category}</span><div className="resume-card-footer"><span>Edited {formatDate(resume.updatedAt, 'MMM d')}</span><span>{resume.size}</span></div><div className="resume-linked"><strong>{linked.length} linked {linked.length === 1 ? 'application' : 'applications'}</strong>{linked.length > 0 && <span>{linked.slice(0, 2).map((item) => item.company).join(', ')}{linked.length > 2 ? ` +${linked.length - 2}` : ''}</span>}</div><Link className="resume-link" to="/applications">Manage applications <span>→</span></Link></article>
        })}</div> : <div className="panel empty-state"><span className="empty-icon"><FileText size={22} /></span><h3>No resumes in this category</h3><p>Upload or choose another category to view your resumes.</p><button className="button button-secondary" onClick={() => setCategory('All resumes')}>View all resumes</button></div>}
      </section>
      <p className="demo-notice">Demo mode: resume file selections aren’t uploaded or saved. Your resume list resets when you refresh.</p>
    </>
  )
}
