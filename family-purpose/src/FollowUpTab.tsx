import { useMemo, useState } from "react";
import {
  CHECK_IN_OUTCOMES,
  RECOMMENDED_SERVICES,
  type CheckIn,
  type CheckInOutcome,
  type FollowUp,
  type RecommendedService,
} from "./types";
import { updateCheckIn } from "./storage";
import {
  buildFollowUpQueue,
  createFollowUp,
  formatDueLabel,
  formatStamp,
  needsOutcome,
  studentLabel,
  type FollowUpItem,
} from "./followups";

function CheckInHeading({ checkIn }: { checkIn: CheckIn }) {
  return (
    <>
      <h3>{studentLabel(checkIn)}</h3>
      <p className="checkin-meta">
        Grade {checkIn.grade} · {checkIn.classPeriod} ·{" "}
        {formatStamp(checkIn.createdAt)}
      </p>
      {checkIn.reasons.length > 0 && (
        <p className="checkin-meta">{checkIn.reasons.join(" · ")}</p>
      )}
    </>
  );
}

/** Recording what happened after the conversation, before the debrief goes out. */
function OutcomeRecorder({
  checkIn,
  onChanged,
}: {
  checkIn: CheckIn;
  onChanged: (message?: string) => void;
}) {
  const [notes, setNotes] = useState(checkIn.outcomeNotes ?? "");

  const save = (outcome: CheckInOutcome) => {
    updateCheckIn(checkIn.id, {
      outcome,
      outcomeNotes: notes.trim(),
      ...(outcome === "Follow-up scheduled" && !checkIn.followUp
        ? { followUp: createFollowUp(checkIn.createdAt) }
        : {}),
    });
    onChanged("Outcome recorded");
  };

  return (
    <li className="checkin-item">
      <CheckInHeading checkIn={checkIn} />
      <div className="field">
        <label htmlFor={`outcome-notes-${checkIn.id}`} className="sr-only">
          What happened with {checkIn.studentName}
        </label>
        <textarea
          id={`outcome-notes-${checkIn.id}`}
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What happened after the check-in…"
        />
      </div>
      <div
        className="pill-row"
        role="group"
        aria-label={`Outcome for ${checkIn.studentName}`}
      >
        {CHECK_IN_OUTCOMES.map((o) => (
          <button
            key={o}
            type="button"
            className="pill"
            onClick={() => save(o)}
          >
            {o}
          </button>
        ))}
      </div>
    </li>
  );
}

function FollowUpCard({
  item,
  onChanged,
}: {
  item: FollowUpItem;
  onChanged: (message?: string) => void;
}) {
  const { checkIn, followUp } = item;
  const [notes, setNotes] = useState(followUp.notes);
  const [showServices, setShowServices] = useState(
    followUp.services.length > 0 || followUp.careTeamReferral,
  );

  const patch = (changes: Partial<FollowUp>, message?: string) => {
    updateCheckIn(checkIn.id, { followUp: { ...followUp, ...changes } });
    onChanged(message);
  };

  const toggleService = (service: RecommendedService) => {
    const services = followUp.services.includes(service)
      ? followUp.services.filter((s) => s !== service)
      : [...followUp.services, service];
    patch({ services, notes });
  };

  return (
    <li className={`checkin-item follow-up follow-up-${item.state}`}>
      <div className="checkin-item-header">
        <div>
          <CheckInHeading checkIn={checkIn} />
        </div>
        <span className={`tag tag-${item.state}`}>
          {formatDueLabel(followUp)}
        </span>
      </div>

      {checkIn.outcome && (
        <p className="checkin-meta">Outcome at check-in: {checkIn.outcome}</p>
      )}

      <div className="field">
        <label htmlFor={`follow-notes-${checkIn.id}`} className="sr-only">
          Follow-up notes for {checkIn.studentName}
        </label>
        <textarea
          id={`follow-notes-${checkIn.id}`}
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => notes !== followUp.notes && patch({ notes })}
          placeholder="What came of the follow-up…"
        />
      </div>

      <div className="btn-row">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setShowServices((v) => !v)}
          aria-expanded={showServices}
        >
          {showServices ? "Hide services" : "Recommend services"}
        </button>
        {followUp.completedAt ? (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() =>
              patch({ completedAt: undefined, notes }, "Follow-up reopened")
            }
          >
            Reopen
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() =>
              patch(
                { completedAt: new Date().toISOString(), notes },
                "Follow-up closed",
              )
            }
          >
            Mark followed up
          </button>
        )}
      </div>

      {showServices && (
        <div className="field service-picker">
          <label id={`services-label-${checkIn.id}`}>
            Recommended services
          </label>
          <div
            className="pill-row"
            role="group"
            aria-labelledby={`services-label-${checkIn.id}`}
          >
            {RECOMMENDED_SERVICES.map((service) => {
              const selected = followUp.services.includes(service);
              return (
                <button
                  key={service}
                  type="button"
                  className={`pill ${selected ? "pill-active" : ""}`}
                  aria-pressed={selected}
                  onClick={() => toggleService(service)}
                >
                  {service}
                </button>
              );
            })}
          </div>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={followUp.careTeamReferral}
              onChange={(e) =>
                patch(
                  { careTeamReferral: e.target.checked, notes },
                  e.target.checked
                    ? "Added to the CARE team debrief"
                    : "Removed from the CARE team debrief",
                )
              }
            />
            <span>Refer to the CARE team</span>
          </label>
          {followUp.careTeamReferral && (
            <p className="hint">
              This student is on the CARE team debrief, under Debrief → CARE
              team referrals.
            </p>
          )}
        </div>
      )}
    </li>
  );
}

function Section({
  title,
  hint,
  items,
  onChanged,
}: {
  title: string;
  hint?: string;
  items: FollowUpItem[];
  onChanged: (message?: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="card">
      <h2>
        {title} ({items.length})
      </h2>
      {hint && <p className="hint">{hint}</p>}
      <ul className="checkin-list" aria-label={title}>
        {items.map((item) => (
          <FollowUpCard
            key={item.checkIn.id}
            item={item}
            onChanged={onChanged}
          />
        ))}
      </ul>
    </div>
  );
}

export default function FollowUpTab({
  checkIns,
  onChanged,
}: {
  checkIns: CheckIn[];
  onChanged: (message?: string) => void;
}) {
  const [showDone, setShowDone] = useState(false);

  const queue = useMemo(() => buildFollowUpQueue(checkIns), [checkIns]);
  const pendingOutcomes = useMemo(() => needsOutcome(checkIns), [checkIns]);

  const nothingToDo =
    queue.open.length === 0 && pendingOutcomes.length === 0;

  return (
    <>
      <div className="card">
        <h2>Follow-up</h2>
        <p className="hint">
          Record what happened after a check-in, work the 48-hour follow-up
          list, and point students toward services or the CARE team.
        </p>
        <div className="stat-grid">
          <div
            className={`stat ${queue.overdue.length > 0 ? "stat-alert" : ""}`}
          >
            <span className="stat-value">{queue.overdue.length}</span>
            <span className="stat-label">Overdue</span>
          </div>
          <div
            className={`stat ${queue.dueToday.length > 0 ? "stat-accent" : ""}`}
          >
            <span className="stat-value">{queue.dueToday.length}</span>
            <span className="stat-label">Due today</span>
          </div>
          <div className="stat">
            <span className="stat-value">{queue.upcoming.length}</span>
            <span className="stat-label">Upcoming</span>
          </div>
          <div className="stat">
            <span className="stat-value">{pendingOutcomes.length}</span>
            <span className="stat-label">Awaiting an outcome</span>
          </div>
        </div>
        {nothingToDo && (
          <p className="empty-state">
            <span className="empty-state-icon" aria-hidden="true">✓</span>
            Nothing outstanding. Follow-ups you schedule on a check-in show up
            here, due 48 hours later.
          </p>
        )}
      </div>

      <Section
        title="Overdue"
        hint="Past the 48-hour window."
        items={queue.overdue}
        onChanged={onChanged}
      />
      <Section title="Due today" items={queue.dueToday} onChanged={onChanged} />
      <Section title="Upcoming" items={queue.upcoming} onChanged={onChanged} />

      {pendingOutcomes.length > 0 && (
        <div className="card">
          <h2>Awaiting an outcome ({pendingOutcomes.length})</h2>
          <p className="hint">
            Check-ins from the past week with no outcome yet. Add one before the
            debrief goes out.
          </p>
          <ul className="checkin-list" aria-label="Awaiting an outcome">
            {pendingOutcomes.map((c) => (
              <OutcomeRecorder key={c.id} checkIn={c} onChanged={onChanged} />
            ))}
          </ul>
        </div>
      )}

      {queue.done.length > 0 && (
        <div className="card">
          <div className="checkin-item-header">
            <h2>Completed ({queue.done.length})</h2>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setShowDone((v) => !v)}
              aria-expanded={showDone}
            >
              {showDone ? "Hide" : "Show"}
            </button>
          </div>
          {showDone && (
            <ul className="checkin-list" aria-label="Completed follow-ups">
              {queue.done.map((item) => (
                <FollowUpCard
                  key={item.checkIn.id}
                  item={item}
                  onChanged={onChanged}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
}
