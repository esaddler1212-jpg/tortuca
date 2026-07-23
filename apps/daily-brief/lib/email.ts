export interface PriorityEmail {
  id: string
  from: string
  subject: string
  snippet: string
  receivedAt: string
  reason: string
}

export function isEmailConfigured(): boolean {
  // A real integration would use the Gmail API (OAuth). We expose the flag so
  // the UI can indicate whether priorities are live or sample.
  return Boolean(process.env.GMAIL_ACCESS_TOKEN)
}

const SAMPLE_EMAILS: PriorityEmail[] = [
  {
    id: 'em-1',
    from: 'ops@print-partner.example',
    subject: 'Action needed: 3 orders awaiting approval',
    snippet: 'The following Easy Supply orders are on hold pending your approval…',
    receivedAt: '2026-07-23T07:12:00.000Z',
    reason: 'Contains “action needed”',
  },
  {
    id: 'em-2',
    from: 'label@northstar.example',
    subject: 'Re: North Star term sheet',
    snippet: 'Following up on the draft — can we get your signature by EOD?',
    receivedAt: '2026-07-23T06:40:00.000Z',
    reason: 'Marked important',
  },
  {
    id: 'em-3',
    from: 'studio@bookings.example',
    subject: 'Session confirmation for today 10:00',
    snippet: 'Your studio session is confirmed. Reply to reschedule.',
    receivedAt: '2026-07-22T21:03:00.000Z',
    reason: 'Time-sensitive (today)',
  },
]

/**
 * Returns today's priority emails. Real Gmail wiring (OAuth + Gmail API) plugs
 * in here; until then it returns a representative sample so the brief renders.
 */
export async function getPriorityEmails(): Promise<{
  emails: PriorityEmail[]
  configured: boolean
}> {
  // Placeholder for Gmail API call when GMAIL_ACCESS_TOKEN is present.
  return { emails: SAMPLE_EMAILS, configured: isEmailConfigured() }
}
