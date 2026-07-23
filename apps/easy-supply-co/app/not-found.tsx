export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="text-2xl font-semibold uppercase tracking-wide">
        Not found
      </h1>
      <p className="mt-4 text-neutral-500">
        We couldn&apos;t find that page.
      </p>
      <a
        href="/products"
        className="mt-6 inline-block bg-black px-6 py-3 text-xs uppercase tracking-widest text-white hover:opacity-80"
      >
        Back to shop
      </a>
    </div>
  )
}
