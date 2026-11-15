import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { after, before, beforeEach, test } from 'node:test'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  collection,
  deleteField,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore'

const projectId = 'demo-applytrack'
const ownerUid = 'owner-user'
const otherUid = 'other-user'
const applicationId = 'application-1'
const testDate = Timestamp.fromDate(new Date('2026-01-15T12:00:00.000Z'))
const ownerEmail = 'owner@example.com'

let testEnvironment

function applicationReference(firestore, uid = ownerUid, id = applicationId) {
  return doc(firestore, 'users', uid, 'applications', id)
}

function profileReference(firestore, uid = ownerUid) {
  return doc(firestore, 'users', uid)
}

function profileFirestore(uid = ownerUid, email = ownerEmail) {
  return testEnvironment.authenticatedContext(uid, {
    email,
    email_verified: true,
  }).firestore()
}

function profileFields(overrides = {}) {
  return {
    displayName: 'Ada Lovelace',
    email: ownerEmail,
    photoURL: null,
    phoneNumber: '+1 555 0100',
    college: 'Northstar University',
    degree: 'B.S. Computer Science',
    branch: 'Software Engineering',
    graduationYear: 2027,
    academicYear: 'Third year',
    technicalSkills: ['React', 'Firebase'],
    programmingLanguages: ['JavaScript', 'Python'],
    tools: ['Git', 'Figma'],
    experience: [{
      title: 'Software Engineering Intern',
      company: 'Northstar Labs',
      location: 'Remote',
      startDate: '2025-06',
      endDate: '2025-08',
      description: 'Built product features.',
    }],
    projects: [{
      name: 'ApplyTrack',
      url: 'https://example.com',
      description: 'A career application tracker.',
    }],
    certifications: [{
      name: 'Cloud Fundamentals',
      issuer: 'Northstar Academy',
      issueDate: '2025-04',
      credentialURL: 'https://example.com/certificate',
    }],
    preferredRoles: ['Frontend Engineer'],
    preferredLocations: ['Remote'],
    professionalSummary: 'Software engineering student interested in web development.',
    linkedinURL: 'https://linkedin.com/in/ada',
    githubURL: 'https://github.com/ada',
    portfolioURL: 'https://ada.example.com',
    ...overrides,
  }
}

function validProfile(overrides = {}) {
  return {
    ...profileFields(overrides),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
}

async function createOwnerProfile(overrides = {}) {
  const firestore = profileFirestore()
  const reference = profileReference(firestore)
  await assertSucceeds(setDoc(reference, validProfile(overrides)))
  return { firestore, reference }
}

function validApplication(overrides = {}) {
  return {
    company: 'Northstar Labs',
    role: 'Software Engineer',
    location: 'Remote',
    source: 'Company website',
    appliedAt: testDate,
    status: 'Applied',
    color: '#5146e5',
    recruiter: '',
    recruiterEmail: '',
    notes: '',
    resumeId: '',
    activity: [{ type: 'Application added', date: testDate }],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...overrides,
  }
}

function ownerFirestore() {
  return testEnvironment.authenticatedContext(ownerUid).firestore()
}

async function createOwnerApplication(id = applicationId) {
  const firestore = ownerFirestore()
  const reference = applicationReference(firestore, ownerUid, id)
  await assertSucceeds(setDoc(reference, validApplication()))
  return { firestore, reference }
}

async function createTwoEntryHistory(id = applicationId) {
  const result = await createOwnerApplication(id)
  const snapshot = await getDoc(result.reference)
  const firstEntry = snapshot.data().activity[0]
  const secondEntry = { type: 'Interview scheduled', date: testDate }
  const activity = [firstEntry, secondEntry]

  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    await updateDoc(applicationReference(context.firestore(), ownerUid, id), { activity })
  })

  return { ...result, activity }
}

function statusEvent(fromStatus = 'Applied', toStatus = 'Interview', overrides = {}) {
  return {
    type: 'status_changed',
    fromStatus,
    toStatus,
    date: testDate,
    ...overrides,
  }
}

before(async () => {
  const rules = await readFile(new URL('../firestore.rules', import.meta.url), 'utf8')
  testEnvironment = await initializeTestEnvironment({
    projectId,
    firestore: {
      host: '127.0.0.1',
      port: 8080,
      rules,
    },
  })
})

after(async () => {
  if (testEnvironment) await testEnvironment.cleanup()
})

beforeEach(async () => {
  await testEnvironment.clearFirestore()
})

test('an authenticated user can create their own valid Career Profile', async () => {
  const firestore = profileFirestore()
  const reference = profileReference(firestore)

  await assertSucceeds(setDoc(reference, validProfile()))
  const created = await assertSucceeds(getDoc(reference))

  assert.equal(created.data().displayName, 'Ada Lovelace')
  assert.equal(created.data().email, ownerEmail)
  assert.ok(created.data().createdAt instanceof Timestamp)
  assert.ok(created.data().updatedAt instanceof Timestamp)
})

test('an authenticated user can read their own Career Profile', async () => {
  const { reference } = await createOwnerProfile()

  const profile = await assertSucceeds(getDoc(reference))
  assert.equal(profile.data().college, 'Northstar University')
})

test('a user cannot read or modify another user Career Profile', async () => {
  await createOwnerProfile()
  const otherFirestore = profileFirestore(otherUid, 'other@example.com')
  const ownerReference = profileReference(otherFirestore, ownerUid)

  await assertFails(getDoc(ownerReference))
  await assertFails(updateDoc(ownerReference, {
    phoneNumber: '+1 555 0199',
    updatedAt: serverTimestamp(),
  }))
  await assertFails(setDoc(
    profileReference(otherFirestore, ownerUid),
    validProfile(),
  ))
})

test('an authenticated user can update their complete Career Profile', async () => {
  const { reference } = await createOwnerProfile()
  const original = (await getDoc(reference)).data()

  await assertSucceeds(updateDoc(reference, {
    ...profileFields({
      displayName: 'Ada Byron',
      phoneNumber: '+1 555 0111',
      college: 'Updated University',
      degree: 'M.S. Computer Science',
      branch: 'Machine Learning',
      graduationYear: 2028,
      academicYear: 'Graduate year one',
      technicalSkills: ['React', 'Firebase', 'Accessibility'],
      programmingLanguages: ['JavaScript', 'Python', 'Go'],
      tools: ['Git', 'Figma', 'VS Code'],
      experience: [{
        title: 'Software Engineer',
        company: 'Example Company',
        location: 'New York',
        startDate: '2025-06',
        endDate: '',
        description: 'Developed web services.',
      }],
      projects: [{
        name: 'Portfolio',
        url: 'https://ada.example.com',
        description: 'Personal portfolio.',
      }],
      certifications: [{
        name: 'Web Accessibility',
        issuer: 'Example Institute',
        issueDate: '2026-01',
        credentialURL: 'https://example.com/credential',
      }],
      preferredRoles: ['Software Engineer', 'Frontend Engineer'],
      preferredLocations: ['Remote', 'New York'],
      professionalSummary: 'Updated professional summary.',
      linkedinURL: 'https://linkedin.com/in/ada-byron',
      githubURL: 'https://github.com/ada-byron',
      portfolioURL: 'https://ada-byron.example.com',
    }),
    updatedAt: serverTimestamp(),
  }))

  const updated = (await getDoc(reference)).data()
  assert.equal(updated.displayName, 'Ada Byron')
  assert.equal(updated.graduationYear, 2028)
  assert.equal(updated.createdAt.toMillis(), original.createdAt.toMillis())
})

test('an authenticated user can partially update their Career Profile', async () => {
  const { reference } = await createOwnerProfile()
  const original = (await getDoc(reference)).data()

  await assertSucceeds(updateDoc(reference, {
    phoneNumber: '+1 555 0122',
    updatedAt: serverTimestamp(),
  }))

  const updated = (await getDoc(reference)).data()
  assert.equal(updated.phoneNumber, '+1 555 0122')
  assert.equal(updated.college, original.college)
  assert.equal(updated.createdAt.toMillis(), original.createdAt.toMillis())
})

test('clearing graduationYear is permitted', async () => {
  const { reference } = await createOwnerProfile()

  await assertSucceeds(updateDoc(reference, {
    graduationYear: deleteField(),
    updatedAt: serverTimestamp(),
  }))

  assert.equal('graduationYear' in (await getDoc(reference)).data(), false)
})

test('changing createdAt is rejected', async () => {
  const { reference } = await createOwnerProfile()
  const original = (await getDoc(reference)).data()

  await assertFails(updateDoc(reference, {
    createdAt: Timestamp.fromMillis(original.createdAt.toMillis() + 1),
    updatedAt: serverTimestamp(),
  }))
})

test('a verified Auth email must match the Career Profile email', async () => {
  const firestore = profileFirestore(ownerUid, ownerEmail)

  await assertFails(setDoc(
    profileReference(firestore),
    validProfile({ email: 'different@example.com' }),
  ))
})

test('unexpected profile fields and invalid field types are rejected', async () => {
  const firestore = profileFirestore()
  const reference = profileReference(firestore)

  await assertFails(setDoc(reference, validProfile({ isAdmin: true })))
  await assertFails(setDoc(reference, validProfile({ graduationYear: 2026.5 })))
  await assertFails(setDoc(reference, validProfile({ technicalSkills: 'React' })))
})

test('unauthenticated users cannot read or write Career Profiles', async () => {
  await createOwnerProfile()
  const anonymousFirestore = testEnvironment.unauthenticatedContext().firestore()
  const reference = profileReference(anonymousFirestore)

  await assertFails(getDoc(reference))
  await assertFails(updateDoc(reference, {
    phoneNumber: '+1 555 0199',
    updatedAt: serverTimestamp(),
  }))
  await assertFails(setDoc(reference, validProfile()))
})

test('unauthenticated users cannot read or write applications', async () => {
  await createOwnerApplication()
  const anonymousFirestore = testEnvironment.unauthenticatedContext().firestore()
  const anonymousReference = applicationReference(anonymousFirestore)

  await assertFails(getDoc(anonymousReference))
  await assertFails(getDocs(collection(
    anonymousFirestore,
    'users',
    ownerUid,
    'applications',
  )))
  await assertFails(setDoc(
    applicationReference(anonymousFirestore, ownerUid, 'anonymous-create'),
    validApplication(),
  ))
  await assertFails(updateDoc(anonymousReference, {
    company: 'Unauthorized edit',
    updatedAt: serverTimestamp(),
  }))
  await assertFails(deleteDoc(anonymousReference))
})

test('the owner can create, read, update, and delete an application', async () => {
  const firestore = ownerFirestore()
  const reference = applicationReference(firestore)

  await assertSucceeds(setDoc(reference, validApplication()))
  const created = await assertSucceeds(getDoc(reference))
  assert.equal(created.data().company, 'Northstar Labs')

  await assertSucceeds(updateDoc(reference, {
    role: 'Senior Software Engineer',
    updatedAt: serverTimestamp(),
  }))
  const updated = await getDoc(reference)
  assert.equal(updated.data().role, 'Senior Software Engineer')

  await assertSucceeds(deleteDoc(reference))
  assert.equal((await getDoc(reference)).exists(), false)
})

test('a complete application with Firestore timestamps is accepted', async () => {
  const firestore = ownerFirestore()
  await assertSucceeds(setDoc(
    applicationReference(firestore),
    validApplication(),
  ))
})

test('another authenticated user cannot access the owner application', async () => {
  await createOwnerApplication()
  const otherFirestore = testEnvironment.authenticatedContext(otherUid).firestore()
  const ownerReference = applicationReference(otherFirestore, ownerUid)

  await assertFails(getDoc(ownerReference))
  await assertFails(updateDoc(ownerReference, {
    company: 'Cross-user edit',
    updatedAt: serverTimestamp(),
  }))
  await assertFails(deleteDoc(ownerReference))
  await assertFails(setDoc(
    applicationReference(otherFirestore, ownerUid, 'cross-user-create'),
    validApplication(),
  ))
})

test('applications missing required fields or values are rejected', async () => {
  const firestore = ownerFirestore()
  const missingCompany = validApplication()
  delete missingCompany.company
  const missingSource = validApplication()
  delete missingSource.source

  await assertFails(setDoc(
    applicationReference(firestore, ownerUid, 'missing-company'),
    missingCompany,
  ))
  await assertFails(setDoc(
    applicationReference(firestore, ownerUid, 'missing-source'),
    missingSource,
  ))
  await assertFails(setDoc(
    applicationReference(firestore, ownerUid, 'empty-company'),
    validApplication({ company: '' }),
  ))
})

test('application creation requires one valid non-status initial activity entry', async () => {
  const firestore = ownerFirestore()

  await assertFails(setDoc(
    applicationReference(firestore, ownerUid, 'empty-initial-activity'),
    validApplication({ activity: [] }),
  ))
  await assertFails(setDoc(
    applicationReference(firestore, ownerUid, 'status-initial-activity'),
    validApplication({ activity: [statusEvent('Wishlist', 'Applied')] }),
  ))
  await assertFails(setDoc(
    applicationReference(firestore, ownerUid, 'malformed-initial-activity'),
    validApplication({ activity: [{ type: 'Application added' }] }),
  ))
  await assertFails(setDoc(
    applicationReference(firestore, ownerUid, 'fabricated-initial-activity'),
    validApplication({
      activity: [{ type: 'Offer received', date: testDate }],
    }),
  ))
})

test('a normal edit succeeds without changing activity history', async () => {
  const { reference } = await createOwnerApplication()
  const before = (await getDoc(reference)).data()

  await assertSucceeds(updateDoc(reference, {
    notes: 'Follow up next week.',
    updatedAt: serverTimestamp(),
  }))
  await assertFails(updateDoc(reference, {
    notes: 'Attempt to alter history.',
    activity: [{ ...before.activity[0], type: 'Altered history' }],
    updatedAt: serverTimestamp(),
  }))
  await assertFails(updateDoc(reference, {
    notes: 'Attempt to append a fabricated event.',
    activity: [
      ...before.activity,
      { type: 'Offer received', date: testDate },
    ],
    updatedAt: serverTimestamp(),
  }))

  const after = (await getDoc(reference)).data()
  assert.equal(after.notes, 'Follow up next week.')
  assert.deepEqual(after.activity, before.activity)
})

test('a valid status change appends exactly one valid event', async () => {
  const { reference, activity } = await createTwoEntryHistory()
  const appendedEvent = statusEvent()

  await assertSucceeds(updateDoc(reference, {
    status: 'Interview',
    activity: [...activity, appendedEvent],
    updatedAt: serverTimestamp(),
  }))

  const updated = (await getDoc(reference)).data()
  assert.equal(updated.activity.length, activity.length + 1)
  assert.deepEqual(updated.activity.slice(0, -1), activity)
  assert.deepEqual(updated.activity.at(-1), appendedEvent)
})

test('a status change preserves all 99 prior entries at the activity limit', async () => {
  const { reference } = await createOwnerApplication()
  const activity = Array.from({ length: 99 }, (_, index) => ({
    type: `Prior activity ${index}`,
    date: testDate,
  }))

  await testEnvironment.withSecurityRulesDisabled(async (context) => {
    await updateDoc(applicationReference(context.firestore()), { activity })
  })

  const appendedEvent = statusEvent()
  await assertSucceeds(updateDoc(reference, {
    status: 'Interview',
    activity: [...activity, appendedEvent],
    updatedAt: serverTimestamp(),
  }))

  const updatedActivity = (await getDoc(reference)).data().activity
  assert.equal(updatedActivity.length, 100)
  assert.deepEqual(updatedActivity.slice(0, 99), activity)
  assert.deepEqual(updatedActivity[99], appendedEvent)
})

test('a malformed or mismatched status event is rejected', async () => {
  const { reference } = await createOwnerApplication()
  const activity = (await getDoc(reference)).data().activity

  await assertFails(updateDoc(reference, {
    status: 'Interview',
    activity: [...activity, statusEvent('Wishlist', 'Interview')],
    updatedAt: serverTimestamp(),
  }))
  await assertFails(updateDoc(reference, {
    status: 'Interview',
    activity: [...activity, statusEvent('Applied', 'Offer')],
    updatedAt: serverTimestamp(),
  }))
  await assertFails(updateDoc(reference, {
    status: 'Interview',
    activity: [...activity, statusEvent('Applied', 'Interview', { date: 'not-a-timestamp' })],
    updatedAt: serverTimestamp(),
  }))
})

test('a status change that reorders existing activity is rejected', async () => {
  const { reference, activity } = await createTwoEntryHistory()

  await assertFails(updateDoc(reference, {
    status: 'Interview',
    activity: [activity[1], activity[0], statusEvent()],
    updatedAt: serverTimestamp(),
  }))
})

test('a status change that alters existing activity is rejected', async () => {
  const { reference, activity } = await createTwoEntryHistory()

  await assertFails(updateDoc(reference, {
    status: 'Interview',
    activity: [
      { ...activity[0], type: 'Altered history' },
      activity[1],
      statusEvent(),
    ],
    updatedAt: serverTimestamp(),
  }))
})

test('a status change without an appended event is rejected', async () => {
  const { reference } = await createOwnerApplication()
  const activity = (await getDoc(reference)).data().activity

  await assertFails(updateDoc(reference, {
    status: 'Interview',
    updatedAt: serverTimestamp(),
  }))
  await assertFails(updateDoc(reference, {
    status: 'Interview',
    activity,
    updatedAt: serverTimestamp(),
  }))
})

test('an application with a nonexistent resume reference is rejected', async () => {
  const firestore = ownerFirestore()

  await assertFails(setDoc(
    applicationReference(firestore),
    validApplication({ resumeId: 'missing-resume' }),
  ))
})

test('invalid application, activity, and metadata timestamps are rejected', async () => {
  const firestore = ownerFirestore()

  await assertFails(setDoc(
    applicationReference(firestore, ownerUid, 'string-applied-date'),
    validApplication({ appliedAt: '2026-01-15T12:00:00.000Z' }),
  ))
  await assertFails(setDoc(
    applicationReference(firestore, ownerUid, 'string-activity-date'),
    validApplication({
      activity: [{ type: 'Application added', date: '2026-01-15T12:00:00.000Z' }],
    }),
  ))
  await assertFails(setDoc(
    applicationReference(firestore, ownerUid, 'invalid-created-at'),
    validApplication({ createdAt: 'not-a-timestamp' }),
  ))
})

test('invalid application field types and statuses are rejected', async () => {
  const firestore = ownerFirestore()

  await assertFails(setDoc(
    applicationReference(firestore, ownerUid, 'numeric-company'),
    validApplication({ company: 42 }),
  ))
  await assertFails(setDoc(
    applicationReference(firestore, ownerUid, 'unknown-status'),
    validApplication({ status: 'Pending' }),
  ))
  await assertFails(setDoc(
    applicationReference(firestore, ownerUid, 'numeric-resume'),
    validApplication({ resumeId: 42 }),
  ))
})
