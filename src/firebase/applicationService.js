import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { auth, db } from './config.js'

const statuses = ['Wishlist', 'Applied', 'Interview', 'Offer', 'Rejected']
const editableTextFields = {
  company: { maxLength: 160, required: true },
  role: { maxLength: 200, required: true },
  location: { maxLength: 160, required: false },
  source: { maxLength: 100, required: true },
  recruiter: { maxLength: 160, required: false },
  recruiterEmail: { maxLength: 254, required: false },
  notes: { maxLength: 5000, required: false },
}

class ApplicationServiceError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ApplicationServiceError'
  }
}

function getUserUid() {
  const uid = auth.currentUser?.uid
  if (!uid) throw new ApplicationServiceError('Sign in before managing applications.')
  return uid
}

function applicationCollection(uid) {
  return collection(db, 'users', uid, 'applications')
}

function applicationDocument(uid, applicationId) {
  if (typeof applicationId !== 'string' || !applicationId.trim() || applicationId.includes('/')) {
    throw new ApplicationServiceError('A valid application is required.')
  }
  return doc(db, 'users', uid, 'applications', applicationId)
}

function validateText(value, field, { maxLength, required }) {
  if (typeof value !== 'string') {
    throw new ApplicationServiceError(`Enter a valid ${field}.`)
  }
  const normalized = field === 'notes' ? value : value.trim()
  if (required && !normalized) throw new ApplicationServiceError(`Enter a ${field}.`)
  if (normalized.length > maxLength) {
    throw new ApplicationServiceError(`${field} must be ${maxLength} characters or fewer.`)
  }
  return normalized
}

function toTimestamp(value, field) {
  if (value instanceof Timestamp) return value
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new ApplicationServiceError(`Enter a valid ${field} date and time.`)
  }
  return Timestamp.fromDate(date)
}

function validateStatus(status) {
  if (!statuses.includes(status)) {
    throw new ApplicationServiceError('Choose a valid application status.')
  }
  return status
}

function normalizeResumeId(resumeId) {
  if (resumeId == null || resumeId === '') return ''
  if (typeof resumeId !== 'string' || resumeId.includes('/')) {
    throw new ApplicationServiceError('Choose a valid resume.')
  }
  return resumeId
}

async function assertResumeExists(uid, resumeId) {
  if (!resumeId) return
  const resumeReference = doc(db, 'users', uid, 'resumes', resumeId)
  const resumeSnapshot = await getDoc(resumeReference)
  if (!resumeSnapshot.exists()) {
    throw new ApplicationServiceError(
      'The selected resume is demo-only and is not in your Firestore vault yet. Choose “No resume linked” until resume integration is available.',
    )
  }
}

function normalizeCreateValues(values) {
  if (!values || typeof values !== 'object') {
    throw new ApplicationServiceError('Enter the application details.')
  }

  const application = {}
  for (const [field, constraints] of Object.entries(editableTextFields)) {
    application[field] = validateText(values[field] ?? '', field, constraints)
  }
  application.appliedAt = toTimestamp(values.appliedAt, 'application')
  application.status = validateStatus(values.status)
  application.color = typeof values.color === 'string' && values.color.length <= 32
    ? values.color
    : '#5146e5'
  application.resumeId = normalizeResumeId(values.resumeId)
  return application
}

function normalizeUpdateValues(values) {
  if (!values || typeof values !== 'object') {
    throw new ApplicationServiceError('Enter the application details to update.')
  }

  const updates = {}
  for (const [field, constraints] of Object.entries(editableTextFields)) {
    if (field in values) updates[field] = validateText(values[field], field, constraints)
  }
  if ('appliedAt' in values) updates.appliedAt = toTimestamp(values.appliedAt, 'application')
  if ('status' in values) updates.status = validateStatus(values.status)
  if ('resumeId' in values) updates.resumeId = normalizeResumeId(values.resumeId)
  if (Object.keys(updates).length === 0) {
    throw new ApplicationServiceError('There are no application details to update.')
  }
  return updates
}

function toISOString(value, field) {
  if (value instanceof Timestamp) return value.toDate().toISOString()
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string' && !Number.isNaN(new Date(value).getTime())) {
    return new Date(value).toISOString()
  }
  throw new ApplicationServiceError(`The saved ${field} date is invalid.`)
}

function toFrontendApplication(snapshot) {
  const data = snapshot.data()
  if (!Array.isArray(data.activity)) {
    throw new ApplicationServiceError('An application has invalid activity history.')
  }

  return {
    ...data,
    id: snapshot.id,
    appliedAt: toISOString(data.appliedAt, 'application'),
    createdAt: toISOString(data.createdAt, 'creation'),
    updatedAt: toISOString(data.updatedAt, 'update'),
    activity: data.activity.map((event) => ({
      ...event,
      type: event.type === 'status_changed' ? `Moved to ${event.toStatus}` : event.type,
      date: toISOString(event.date, 'activity'),
    })),
  }
}

function statusChangeEvent(fromStatus, toStatus) {
  return {
    type: 'status_changed',
    fromStatus,
    toStatus,
    date: Timestamp.now(),
  }
}

function appendStatusEvent(current, updates) {
  const nextStatus = updates.status ?? current.status
  if (nextStatus === current.status) return updates

  if (!Array.isArray(current.activity)) {
    throw new ApplicationServiceError('This application has invalid activity history.')
  }
  if (current.activity.length >= 100) {
    throw new ApplicationServiceError('This application has reached its activity history limit.')
  }

  return {
    ...updates,
    activity: [...current.activity, statusChangeEvent(current.status, nextStatus)],
  }
}

export async function createApplication(values) {
  const uid = getUserUid()
  const application = normalizeCreateValues(values)
  await assertResumeExists(uid, application.resumeId)
  const reference = await addDoc(applicationCollection(uid), {
    ...application,
    activity: [{ type: 'Application added', date: Timestamp.now() }],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return reference.id
}

export async function getApplications() {
  const uid = getUserUid()
  const snapshot = await getDocs(applicationCollection(uid))
  return snapshot.docs
    .map(toFrontendApplication)
    .sort((first, second) => second.appliedAt.localeCompare(first.appliedAt))
}

async function updateApplicationWithValues(applicationId, values) {
  const uid = getUserUid()
  const updates = normalizeUpdateValues(values)
  if ('resumeId' in updates) await assertResumeExists(uid, updates.resumeId)
  const reference = applicationDocument(uid, applicationId)

  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(reference)
    if (!snapshot.exists()) throw new ApplicationServiceError('This application no longer exists.')
    const statusAwareUpdates = appendStatusEvent(snapshot.data(), updates)
    transaction.update(reference, {
      ...statusAwareUpdates,
      updatedAt: serverTimestamp(),
    })
  })
}

export async function updateApplication(applicationId, values) {
  return updateApplicationWithValues(applicationId, values)
}

export async function updateApplicationStatus(applicationId, status) {
  return updateApplicationWithValues(applicationId, { status: validateStatus(status) })
}

export async function deleteApplication(applicationId) {
  const uid = getUserUid()
  await deleteDoc(applicationDocument(uid, applicationId))
}

export function getApplicationErrorMessage(error, operation = 'save') {
  if (error instanceof ApplicationServiceError) return error.message
  if (error?.code === 'permission-denied') {
    return 'Firestore rules rejected this request. Check the application details and any linked resume.'
  }
  if (error?.code === 'unauthenticated') return 'Sign in again before managing applications.'
  if (error?.code === 'unavailable' || error?.code === 'network-request-failed') {
    return 'Could not reach Firestore. Check your connection and try again.'
  }
  return operation === 'load'
    ? 'Could not load your applications. Please try again.'
    : 'Could not save your application. Please try again.'
}
