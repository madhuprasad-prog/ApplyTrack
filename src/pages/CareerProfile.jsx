import { useEffect, useMemo, useState } from 'react'
import { BriefcaseBusiness, Check, ChevronRight, CircleUserRound, FileBadge, GraduationCap, Link as LinkIcon, LoaderCircle, Plus, Trash2, Wrench } from 'lucide-react'
import toast from 'react-hot-toast'
import PageHeader from '../components/PageHeader.jsx'
import { getUserProfile, saveUserProfile } from '../firebase/profileService.js'
import useAuth from '../hooks/useAuth.js'

const MAX_LIST_ITEMS = 5

const experienceFields = [
  { key: 'title', label: 'Role or title', required: true, maxLength: 120 },
  { key: 'company', label: 'Company or organization', required: true, maxLength: 160 },
  { key: 'location', label: 'Location', maxLength: 160 },
  { key: 'startDate', label: 'Start date', type: 'month' },
  { key: 'endDate', label: 'End date', type: 'month' },
  { key: 'description', label: 'Description', multiline: true, rows: 3, maxLength: 1000, full: true },
]

const projectFields = [
  { key: 'name', label: 'Project name', required: true, maxLength: 160 },
  { key: 'url', label: 'Project URL', type: 'url', maxLength: 2048 },
  { key: 'description', label: 'Description', multiline: true, rows: 3, maxLength: 1000, full: true },
]

const certificationFields = [
  { key: 'name', label: 'Certification', required: true, maxLength: 160 },
  { key: 'issuer', label: 'Issuing organization', required: true, maxLength: 160 },
  { key: 'issueDate', label: 'Issue date', type: 'month' },
  { key: 'credentialURL', label: 'Credential URL', type: 'url', maxLength: 2048, full: true },
]

function text(value) {
  return typeof value === 'string' ? value : ''
}

function emptyEntry(fields) {
  return Object.fromEntries(fields.map(({ key }) => [key, '']))
}

function normalizeEntries(value, fields) {
  if (!Array.isArray(value)) return []

  return value
    .filter((entry) => entry && typeof entry === 'object' && !Array.isArray(entry))
    .map((entry) => ({
      ...entry,
      ...Object.fromEntries(fields.map(({ key }) => [key, text(entry[key])])),
    }))
}

function profileToForm(profile, fallbackName) {
  return {
    displayName: text(profile?.displayName) || fallbackName,
    phoneNumber: text(profile?.phoneNumber),
    college: text(profile?.college),
    degree: text(profile?.degree),
    branch: text(profile?.branch),
    graduationYear: profile?.graduationYear == null ? '' : String(profile.graduationYear),
    academicYear: text(profile?.academicYear),
    technicalSkills: Array.isArray(profile?.technicalSkills) ? profile.technicalSkills.map(String) : [],
    programmingLanguages: Array.isArray(profile?.programmingLanguages) ? profile.programmingLanguages.map(String) : [],
    tools: Array.isArray(profile?.tools) ? profile.tools.map(String) : [],
    experience: normalizeEntries(profile?.experience, experienceFields),
    projects: normalizeEntries(profile?.projects, projectFields),
    certifications: normalizeEntries(profile?.certifications, certificationFields),
    preferredRoles: Array.isArray(profile?.preferredRoles) ? profile.preferredRoles.map(String) : [],
    preferredLocations: Array.isArray(profile?.preferredLocations) ? profile.preferredLocations.map(String) : [],
    professionalSummary: text(profile?.professionalSummary),
    linkedinURL: text(profile?.linkedinURL),
    githubURL: text(profile?.githubURL),
    portfolioURL: text(profile?.portfolioURL),
  }
}

function prepareEntries(entries, fields, sectionName) {
  const nonEmptyEntries = entries.filter((entry) => fields.some(({ key }) => text(entry[key]).trim()))
  if (nonEmptyEntries.length > MAX_LIST_ITEMS) {
    return { error: `${sectionName} can have up to ${MAX_LIST_ITEMS} entries.` }
  }

  for (const [index, entry] of nonEmptyEntries.entries()) {
    for (const field of fields) {
      const value = text(entry[field.key]).trim()
      if (field.required && !value) {
        return { error: `${sectionName} entry ${index + 1} needs a ${field.label.toLowerCase()}.` }
      }
      if (field.maxLength && value.length > field.maxLength) {
        return { error: `${field.label} must be ${field.maxLength} characters or fewer.` }
      }
    }
  }

  return {
    value: nonEmptyEntries.map((entry) => ({
      ...entry,
      ...Object.fromEntries(fields.map(({ key }) => [key, text(entry[key]).trim()])),
    })),
  }
}

function ProfileField({ id, label, value, onChange, type = 'text', maxLength, placeholder, required = false, multiline = false, rows = 3, readOnly = false, disabled = false, min, max }) {
  const controlProps = {
    id,
    value,
    onChange: (event) => onChange(event.target.value),
    maxLength,
    placeholder,
    required,
    readOnly,
    disabled,
    min,
    max,
    ...(type === 'url' ? { inputMode: 'url' } : {}),
  }

  return (
    <label className="field" htmlFor={id}>
      <span>{label}{required && <> <b>*</b></>}</span>
      {multiline
        ? <textarea {...controlProps} rows={rows} />
        : <input {...controlProps} type={type} />}
    </label>
  )
}

function TagEditor({ id, label, items, onChange, maxLength = 100, disabled }) {
  const [draft, setDraft] = useState('')

  function addItem() {
    const value = draft.trim()
    if (!value) return
    if (value.length > maxLength) {
      toast.error(`${label} must be ${maxLength} characters or fewer.`)
      return
    }
    if (items.some((item) => item.toLocaleLowerCase() === value.toLocaleLowerCase())) {
      setDraft('')
      return
    }
    if (items.length >= MAX_LIST_ITEMS) {
      toast.error(`${label} can have up to ${MAX_LIST_ITEMS} items.`)
      return
    }

    onChange([...items, value])
    setDraft('')
  }

  return (
    <div className="profile-tag-field">
      <label htmlFor={id}>{label}<small>{items.length}/{MAX_LIST_ITEMS}</small></label>
      <div className="profile-tag-control">
        <input
          id={id}
          value={draft}
          maxLength={maxLength}
          disabled={disabled || items.length >= MAX_LIST_ITEMS}
          placeholder={items.length >= MAX_LIST_ITEMS ? 'Maximum reached' : `Add ${label.toLowerCase()}`}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              addItem()
            }
          }}
        />
        <button type="button" className="button button-secondary" onClick={addItem} disabled={disabled || items.length >= MAX_LIST_ITEMS || !draft.trim()} aria-label={`Add ${label}`}>
          <Plus size={15} /><span>Add</span>
        </button>
      </div>
      {items.length > 0
        ? <ul className="profile-tags">{items.map((item, index) => <li key={`${item}-${index}`}><span>{item}</span><button type="button" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))} disabled={disabled} aria-label={`Remove ${item} from ${label}`}><Trash2 size={13} /></button></li>)}</ul>
        : <p className="profile-field-hint">Press Enter or Add to include an item. Up to {MAX_LIST_ITEMS}.</p>}
    </div>
  )
}

function ProfileSection({ icon: Icon, title, description, children }) {
  return (
    <section className="panel profile-section">
      <div className="profile-section-heading">
        <span className="profile-section-icon"><Icon size={17} /></span>
        <div><h2>{title}</h2><p>{description}</p></div>
      </div>
      <div className="profile-section-content">{children}</div>
    </section>
  )
}

function EntryEditor({ title, description, entries, fields, onChange, disabled, emptyMessage }) {
  function updateEntry(index, key, value) {
    onChange(entries.map((entry, entryIndex) => entryIndex === index ? { ...entry, [key]: value } : entry))
  }

  return (
    <div className="profile-entry-group">
      <div className="profile-entry-heading">
        <div><h3>{title}</h3><p>{description}</p></div>
        <button type="button" className="button button-secondary" onClick={() => onChange([...entries, emptyEntry(fields)])} disabled={disabled || entries.length >= MAX_LIST_ITEMS}>
          <Plus size={15} /> Add
        </button>
      </div>
      {entries.length
        ? <div className="profile-entry-list">{entries.map((entry, index) => (
          <article className="profile-entry-card" key={`${title}-${index}`}>
            <div className="profile-entry-card-heading"><strong>{title} {index + 1}</strong><button type="button" className="profile-remove-entry" onClick={() => onChange(entries.filter((_, entryIndex) => entryIndex !== index))} disabled={disabled} aria-label={`Remove ${title.toLowerCase()} ${index + 1}`}><Trash2 size={15} /> Remove</button></div>
            <div className="profile-fields-grid">
              {fields.map((field) => <ProfileField key={field.key} id={`${title}-${index}-${field.key}`} {...field} value={text(entry[field.key])} onChange={(value) => updateEntry(index, field.key, value)} disabled={disabled} />)}
            </div>
          </article>
        ))}</div>
        : <div className="profile-entry-empty"><span><ChevronRight size={15} /></span>{emptyMessage}</div>}
      <p className="profile-field-hint">Up to {MAX_LIST_ITEMS} entries.</p>
    </div>
  )
}

export default function CareerProfile() {
  const { user } = useAuth()
  const fallbackName = user?.displayName?.trim() || ''
  const [form, setForm] = useState(() => profileToForm(null, fallbackName))
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState(null)
  const [loadAttempt, setLoadAttempt] = useState(0)

  useEffect(() => {
    let active = true

    getUserProfile()
      .then((profile) => {
        if (active) setForm(profileToForm(profile, fallbackName))
      })
      .catch((error) => {
        if (active) setLoadError(error?.message || 'We could not load your career profile.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => { active = false }
  }, [user?.uid, fallbackName, loadAttempt])

  const completion = useMemo(() => {
    const completedFields = [
      Boolean(form.displayName.trim()),
      Boolean(user?.email),
      Boolean(form.phoneNumber.trim()),
      Boolean(form.college.trim()),
      Boolean(form.degree.trim()),
      Boolean(form.branch.trim()),
      Boolean(form.academicYear.trim()),
      Boolean(form.graduationYear),
      form.technicalSkills.length > 0,
      form.programmingLanguages.length > 0,
      form.tools.length > 0,
      form.experience.length > 0,
      form.projects.length > 0,
      form.certifications.length > 0,
      form.preferredRoles.length > 0,
      form.preferredLocations.length > 0,
      Boolean(form.professionalSummary.trim()),
      Boolean(form.linkedinURL.trim()),
      Boolean(form.githubURL.trim()),
      Boolean(form.portfolioURL.trim()),
    ]
    return Math.round(completedFields.filter(Boolean).length / completedFields.length * 100)
  }, [form, user?.email])

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
    setSavedAt(null)
    setSaveError('')
  }

  async function submit(event) {
    event.preventDefault()
    setSaveError('')

    const displayName = form.displayName.trim()
    if (!displayName) {
      setSaveError('Enter your full name before saving.')
      return
    }
    if (displayName.length > 120) {
      setSaveError('Your name must be 120 characters or fewer.')
      return
    }
    if (!user?.email) {
      setSaveError('Your Firebase Authentication account does not have an email address.')
      return
    }

    const listFields = [
      ['Technical skills', form.technicalSkills],
      ['Programming languages', form.programmingLanguages],
      ['Tools and technologies', form.tools],
      ['Preferred roles', form.preferredRoles],
      ['Preferred locations', form.preferredLocations],
    ]
    const oversizedList = listFields.find(([, items]) => items.length > MAX_LIST_ITEMS)
    if (oversizedList) {
      setSaveError(`${oversizedList[0]} can have up to ${MAX_LIST_ITEMS} items.`)
      return
    }

    let graduationYear
    if (form.graduationYear.trim()) {
      graduationYear = Number(form.graduationYear)
      if (!Number.isInteger(graduationYear) || graduationYear < 1900 || graduationYear > 2200) {
        setSaveError('Enter a whole graduation year between 1900 and 2200.')
        return
      }
    }

    const experience = prepareEntries(form.experience, experienceFields, 'Experience')
    const projects = prepareEntries(form.projects, projectFields, 'Projects')
    const certifications = prepareEntries(form.certifications, certificationFields, 'Certifications')
    const invalidEntry = [experience, projects, certifications].find((result) => result.error)
    if (invalidEntry) {
      setSaveError(invalidEntry.error)
      return
    }

    const payload = {
      displayName,
      phoneNumber: form.phoneNumber.trim(),
      college: form.college.trim(),
      degree: form.degree.trim(),
      branch: form.branch.trim(),
      academicYear: form.academicYear.trim(),
      technicalSkills: form.technicalSkills.map((item) => item.trim()).filter(Boolean),
      programmingLanguages: form.programmingLanguages.map((item) => item.trim()).filter(Boolean),
      tools: form.tools.map((item) => item.trim()).filter(Boolean),
      experience: experience.value,
      projects: projects.value,
      certifications: certifications.value,
      preferredRoles: form.preferredRoles.map((item) => item.trim()).filter(Boolean),
      preferredLocations: form.preferredLocations.map((item) => item.trim()).filter(Boolean),
      professionalSummary: form.professionalSummary.trim(),
      linkedinURL: form.linkedinURL.trim(),
      githubURL: form.githubURL.trim(),
      portfolioURL: form.portfolioURL.trim(),
      graduationYear: graduationYear === undefined ? null : graduationYear,
    }

    setSaving(true)
    try {
      await saveUserProfile(payload)
      setForm((current) => ({ ...current, ...payload, graduationYear: graduationYear === undefined ? '' : String(graduationYear) }))
      setSavedAt(new Date())
      toast.success('Career profile saved')
    } catch (error) {
      const message = error?.message || 'We could not save your career profile. Please try again.'
      setSaveError(message)
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="YOUR CAREER STORY"
        title="Career profile"
        description="Keep your experience, skills and goals ready for your next opportunity."
        action={<button className="button button-primary" type="submit" form="career-profile-form" disabled={saving || loading || Boolean(loadError)}><Check size={15} />{saving ? 'Saving…' : 'Save profile'}</button>}
      />

      {loading
        ? <div className="panel profile-state" role="status"><LoaderCircle className="profile-spinner" size={20} />Loading your career profile…</div>
        : loadError
          ? <div className="panel profile-load-error" role="alert"><div><strong>Profile couldn’t be loaded</strong><p>{loadError}</p></div><button className="button button-secondary" type="button" onClick={() => { setLoadError(''); setLoading(true); setLoadAttempt((attempt) => attempt + 1) }}>Try again</button></div>
          : <div className="career-profile-layout">
            <form id="career-profile-form" className="career-profile-form" onSubmit={submit}>
              <fieldset className="profile-fieldset" disabled={saving}>
                <ProfileSection icon={CircleUserRound} title="Personal details" description="Your name and the best way to reach you.">
                  <div className="profile-fields-grid">
                    <ProfileField id="profile-display-name" label="Full name" value={form.displayName} onChange={(value) => updateField('displayName', value)} maxLength={120} required placeholder="Your full name" />
                    <ProfileField id="profile-email" label="Email address" value={user?.email || 'Email unavailable'} readOnly type="email" />
                    <ProfileField id="profile-phone" label="Phone number" value={form.phoneNumber} onChange={(value) => updateField('phoneNumber', value)} type="tel" maxLength={32} placeholder="Your phone number" />
                  </div>
                </ProfileSection>

                <ProfileSection icon={GraduationCap} title="Education" description="Add your academic background and expected graduation.">
                  <div className="profile-fields-grid">
                    <ProfileField id="profile-college" label="College or university" value={form.college} onChange={(value) => updateField('college', value)} maxLength={200} placeholder="e.g. Northstar University" />
                    <ProfileField id="profile-degree" label="Degree" value={form.degree} onChange={(value) => updateField('degree', value)} maxLength={120} placeholder="e.g. B.S. Computer Science" />
                    <ProfileField id="profile-branch" label="Branch or specialization" value={form.branch} onChange={(value) => updateField('branch', value)} maxLength={120} placeholder="e.g. Software Engineering" />
                    <ProfileField id="profile-academic-year" label="Current academic year" value={form.academicYear} onChange={(value) => updateField('academicYear', value)} maxLength={80} placeholder="e.g. Third year" />
                    <ProfileField id="profile-graduation-year" label="Graduation year" value={form.graduationYear} onChange={(value) => updateField('graduationYear', value)} type="number" min={1900} max={2200} placeholder="e.g. 2027" />
                  </div>
                </ProfileSection>

                <ProfileSection icon={Wrench} title="Skills" description="Choose up to five items in each category.">
                  <div className="profile-tag-grid">
                    <TagEditor id="profile-technical-skills" label="Technical skills" items={form.technicalSkills} onChange={(value) => updateField('technicalSkills', value)} maxLength={100} disabled={saving} />
                    <TagEditor id="profile-languages" label="Programming languages" items={form.programmingLanguages} onChange={(value) => updateField('programmingLanguages', value)} maxLength={80} disabled={saving} />
                    <TagEditor id="profile-tools" label="Tools and technologies" items={form.tools} onChange={(value) => updateField('tools', value)} maxLength={100} disabled={saving} />
                  </div>
                </ProfileSection>

                <ProfileSection icon={BriefcaseBusiness} title="Experience" description="Include internships, work and relevant volunteer experience.">
                  <EntryEditor title="Experience" description="Role, organization and dates." entries={form.experience} fields={experienceFields} onChange={(value) => updateField('experience', value)} disabled={saving} emptyMessage="No experience added yet." />
                </ProfileSection>

                <ProfileSection icon={LinkIcon} title="Projects" description="Showcase work that demonstrates your skills.">
                  <EntryEditor title="Project" description="Name, link and a short description." entries={form.projects} fields={projectFields} onChange={(value) => updateField('projects', value)} disabled={saving} emptyMessage="No projects added yet." />
                </ProfileSection>

                <ProfileSection icon={FileBadge} title="Certifications" description="List certifications and credentials you have earned.">
                  <EntryEditor title="Certification" description="Credential name, issuer and optional link." entries={form.certifications} fields={certificationFields} onChange={(value) => updateField('certifications', value)} disabled={saving} emptyMessage="No certifications added yet." />
                </ProfileSection>

                <ProfileSection icon={BriefcaseBusiness} title="Career preferences" description="Help focus your search on the roles and locations you want.">
                  <div className="profile-tag-grid">
                    <TagEditor id="profile-preferred-roles" label="Preferred roles" items={form.preferredRoles} onChange={(value) => updateField('preferredRoles', value)} maxLength={120} disabled={saving} />
                    <TagEditor id="profile-preferred-locations" label="Preferred locations" items={form.preferredLocations} onChange={(value) => updateField('preferredLocations', value)} maxLength={160} disabled={saving} />
                  </div>
                </ProfileSection>

                <ProfileSection icon={LinkIcon} title="Professional details" description="Share a short introduction and links to your professional work.">
                  <div className="profile-fields-grid">
                    <ProfileField id="profile-summary" label="Professional summary" value={form.professionalSummary} onChange={(value) => updateField('professionalSummary', value)} maxLength={5000} multiline rows={5} placeholder="A short introduction about your experience, strengths and goals." />
                    <ProfileField id="profile-linkedin" label="LinkedIn profile" value={form.linkedinURL} onChange={(value) => updateField('linkedinURL', value)} type="url" maxLength={2048} placeholder="https://linkedin.com/in/your-name" />
                    <ProfileField id="profile-github" label="GitHub profile" value={form.githubURL} onChange={(value) => updateField('githubURL', value)} type="url" maxLength={2048} placeholder="https://github.com/your-name" />
                    <ProfileField id="profile-portfolio" label="Portfolio URL" value={form.portfolioURL} onChange={(value) => updateField('portfolioURL', value)} type="url" maxLength={2048} placeholder="https://your-portfolio.com" />
                  </div>
                </ProfileSection>
              </fieldset>

              {saveError && <p className="profile-alert" role="alert">{saveError}</p>}
              <div className="profile-form-footer">
                <span role="status" aria-live="polite">{savedAt ? `Saved at ${savedAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'Your profile is private to your account.'}</span>
                <button className="button button-primary" type="submit" disabled={saving}><Check size={15} />{saving ? 'Saving…' : 'Save profile'}</button>
              </div>
            </form>

            <aside className="profile-aside">
              <section className="panel profile-completion">
                <div className="profile-completion-heading"><span className="profile-completion-icon"><Check size={16} /></span><span>Profile completion</span></div>
                <div className="profile-completion-score"><strong>{completion}%</strong><span>complete</span></div>
                <div className="profile-progress-track" role="progressbar" aria-label="Career profile completion" aria-valuemin="0" aria-valuemax="100" aria-valuenow={completion}><span style={{ width: `${completion}%` }} /></div>
                <p>{completion === 100 ? 'Your career profile is complete.' : 'Add a few more details to tell your career story.'}</p>
              </section>
              <section className="panel profile-aside-note">
                <span><CircleUserRound size={17} /></span>
                <div><strong>Private by default</strong><p>Your details are saved to your account and are not shared with other users.</p></div>
              </section>
            </aside>
          </div>}
    </>
  )
}
