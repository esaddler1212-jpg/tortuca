import { ContactForm } from '@/components/ContactForm'

export const metadata = {
  title: 'Contact — ECS Network',
}

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <h1 className="text-2xl font-semibold uppercase tracking-wide">
        Collaborate
      </h1>
      <p className="mt-4 max-w-lg text-neutral-500">
        For partnerships, press, or ventures — reach out and a member of the
        network will get back to you.
      </p>
      <ContactForm />
    </div>
  )
}
