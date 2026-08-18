import { groupChoices, type PeriodChoice } from "./periods";

export default function PeriodPicker({
  id,
  choices,
  value,
  onChange,
}: {
  id: string;
  choices: PeriodChoice[];
  value: PeriodChoice;
  onChange: (choice: PeriodChoice) => void;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>Period</label>
      <select
        id={id}
        value={value.id}
        onChange={(e) => {
          const next = choices.find((c) => c.id === e.target.value);
          if (next) onChange(next);
        }}
      >
        {groupChoices(choices).map((group) => (
          <optgroup key={group.group} label={group.group}>
            {group.choices.map((choice) => (
              <option key={choice.id} value={choice.id}>
                {choice.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <p className="hint">
        {value.range.start} through {value.range.end}
      </p>
    </div>
  );
}
