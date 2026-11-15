const daysFromToday = (offset, hour = 12) => {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  date.setHours(hour, 0, 0, 0)
  return date.toISOString()
}

export const initialApplications = [
  { id: 'a1', company: 'Linear', role: 'Product Designer', location: 'Remote', source: 'LinkedIn', appliedAt: daysFromToday(-2), status: 'Interview', color: '#5e6ad2', recruiter: 'Maya Chen', recruiterEmail: 'maya@linear.app', notes: 'Prepare a portfolio walkthrough focused on systems thinking.', resumeId: 'r1', activity: [{ type: 'Applied', date: daysFromToday(-2) }, { type: 'Interview scheduled', date: daysFromToday(-1) }] },
  { id: 'a2', company: 'Notion', role: 'UX Designer', location: 'San Francisco, CA', source: 'Company website', appliedAt: daysFromToday(-5), status: 'Applied', color: '#222222', recruiter: 'Jordan Lee', recruiterEmail: 'jordan@notion.so', notes: 'Interested in the AI workspace team.', resumeId: 'r2', activity: [{ type: 'Application submitted', date: daysFromToday(-5) }] },
  { id: 'a3', company: 'Figma', role: 'Product Design Intern', location: 'New York, NY', source: 'Referral', appliedAt: daysFromToday(-8), status: 'Offer', color: '#a259ff', recruiter: 'Alex Rivera', recruiterEmail: 'alex@figma.com', notes: 'Offer received — reviewing compensation and start date.', resumeId: 'r1', activity: [{ type: 'Application submitted', date: daysFromToday(-8) }, { type: 'Offer received', date: daysFromToday(-1) }] },
  { id: 'a4', company: 'Stripe', role: 'Associate Product Designer', location: 'Remote', source: 'LinkedIn', appliedAt: daysFromToday(-11), status: 'Interview', color: '#635bff', recruiter: 'Morgan Patel', recruiterEmail: 'morgan@stripe.com', notes: 'First round went well. Follow up with portfolio link.', resumeId: 'r1', activity: [{ type: 'Application submitted', date: daysFromToday(-11) }, { type: 'Recruiter screen', date: daysFromToday(-4) }] },
  { id: 'a5', company: 'Vercel', role: 'Visual Design Intern', location: 'Remote', source: 'Wellfound', appliedAt: daysFromToday(-14), status: 'Applied', color: '#111111', recruiter: 'Sam Kim', recruiterEmail: 'sam@vercel.com', notes: '', resumeId: 'r2', activity: [{ type: 'Application submitted', date: daysFromToday(-14) }] },
  { id: 'a6', company: 'Webflow', role: 'Product Designer', location: 'Remote', source: 'Company website', appliedAt: daysFromToday(-18), status: 'Rejected', color: '#146ef5', recruiter: 'Taylor Brooks', recruiterEmail: 'taylor@webflow.com', notes: 'Keep in touch for future openings.', resumeId: 'r1', activity: [{ type: 'Application submitted', date: daysFromToday(-18) }, { type: 'Not selected', date: daysFromToday(-9) }] },
  { id: 'a7', company: 'Framer', role: 'Product Design Intern', location: 'Amsterdam, NL', source: 'LinkedIn', appliedAt: daysFromToday(-21), status: 'Applied', color: '#0055ff', recruiter: 'Jamie Park', recruiterEmail: 'jamie@framer.com', notes: 'Follow up with hiring team next week.', resumeId: 'r2', activity: [{ type: 'Application submitted', date: daysFromToday(-21) }] },
  { id: 'a8', company: 'Dropbox', role: 'Brand Designer', location: 'Austin, TX', source: 'Referral', appliedAt: daysFromToday(-26), status: 'Rejected', color: '#0061ff', recruiter: 'Drew Wilson', recruiterEmail: 'drew@dropbox.com', notes: '', resumeId: '', activity: [{ type: 'Application submitted', date: daysFromToday(-26) }, { type: 'Not selected', date: daysFromToday(-13) }] },
]

export const initialInterviews = [
  { id: 'i1', applicationId: 'a1', round: 'Portfolio review', date: daysFromToday(1, 14), mode: 'Video call', link: 'https://meet.google.com', notes: 'Walk through the design system case study.' },
  { id: 'i2', applicationId: 'a4', round: 'Hiring manager', date: daysFromToday(3, 10), mode: 'Video call', link: 'https://zoom.us', notes: 'Prepare questions about the product design team.' },
  { id: 'i3', applicationId: 'a1', round: 'Recruiter screen', date: daysFromToday(-1, 11), mode: 'Phone', link: '', notes: 'Discussed team structure and timeline.' },
]

export const initialFollowups = [
  { id: 'f1', applicationId: 'a4', date: daysFromToday(-1), note: 'Send a thank-you note and portfolio link', completed: false },
  { id: 'f2', applicationId: 'a2', date: daysFromToday(1), note: 'Check in on application status', completed: false },
  { id: 'f3', applicationId: 'a7', date: daysFromToday(4), note: 'Follow up with the hiring team', completed: false },
  { id: 'f4', applicationId: 'a1', date: daysFromToday(-3), note: 'Share availability for next round', completed: true },
]

export const initialResumes = [
  { id: 'r1', name: 'Product Designer — 2025', category: 'Product design', updatedAt: daysFromToday(-4), size: '248 KB' },
  { id: 'r2', name: 'UX Design Internship', category: 'Internship', updatedAt: daysFromToday(-12), size: '192 KB' },
  { id: 'r3', name: 'Visual & Brand Design', category: 'Visual design', updatedAt: daysFromToday(-24), size: '310 KB' },
]

export const statuses = ['Wishlist', 'Applied', 'Interview', 'Offer', 'Rejected']
