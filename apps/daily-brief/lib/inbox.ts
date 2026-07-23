import 'server-only'
import type { PriorityEmail } from './email'
import { getPriorityEmails } from './email'
import { fetchGmailPriority, isGoogleConnected } from './google'

export type InboxSource = 'gmail' | 'sample'

export interface Inbox {
  emails: PriorityEmail[]
  source: InboxSource
}

/**
 * Resolves today's priority email from Gmail (if connected) or the sample
 * provider otherwise.
 */
export async function getInbox(): Promise<Inbox> {
  if (isGoogleConnected()) {
    const gmail = await fetchGmailPriority()
    if (gmail) return { emails: gmail, source: 'gmail' }
  }

  const sample = await getPriorityEmails()
  return { emails: sample.emails, source: 'sample' }
}
