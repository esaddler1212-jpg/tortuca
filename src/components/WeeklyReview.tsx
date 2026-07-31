import { CalendarDays, Quote } from "lucide-react";
import type { WeeklyReview as WeeklyReviewData } from "../lib/weeklyReview";

interface Props {
  review: WeeklyReviewData;
}

export function WeeklyReview({ review }: Props) {
  return (
    <section className="panel p-5 border-alfred-gold/30 bg-gradient-to-br from-alfred-gold/5 to-alfred-panel/40">
      <h3 className="font-display text-lg text-alfred-gold mb-3 flex items-center gap-2">
        <CalendarDays className="h-4 w-4" /> {review.headline}
      </h3>
      <ul className="space-y-2 text-sm text-alfred-mist mb-4">
        {review.lines.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ul>
      {review.upcomingSchoolDays.length > 0 && (
        <div className="text-xs text-alfred-mist/90 border-t border-alfred-border pt-3 mb-4">
          <p className="uppercase tracking-wider text-alfred-gold mb-1">School week ahead</p>
          <ul className="space-y-1">
            {review.upcomingSchoolDays.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
      )}
      <blockquote className="border-l-2 border-alfred-gold/40 pl-4">
        <p className="text-sm text-alfred-cream/90 italic flex gap-2">
          <Quote className="h-4 w-4 text-alfred-gold/70 shrink-0 mt-0.5" aria-hidden />
          <span>&ldquo;{review.quote.text}&rdquo;</span>
        </p>
        <footer className="text-xs text-alfred-mist mt-1.5 pl-6">— {review.quote.author}</footer>
      </blockquote>
    </section>
  );
}
