import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-bold text-zinc-700">404</p>
      <h1 className="mt-4 font-display text-2xl font-bold text-white">
        This title isn&apos;t in our catalog
      </h1>
      <Link href="/" className="mt-6 text-accent hover:underline">
        Back to home
      </Link>
    </div>
  );
}
