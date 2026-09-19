import { useState } from "react";

export default function ActivityForm({ activityTypes, suggestedKeys, onAdd }) {
  const [activityType, setActivityType] = useState(activityTypes[0]?.key ?? "");
  const [hour, setHour] = useState(new Date().getHours());

  const sortedTypes = [...activityTypes].sort((a, b) => {
    const aSuggested = suggestedKeys.includes(a.key);
    const bSuggested = suggestedKeys.includes(b.key);
    if (aSuggested === bSuggested) return 0;
    return aSuggested ? -1 : 1;
  });

  function handleSubmit(event) {
    event.preventDefault();
    if (!activityType) return;
    onAdd(activityType, Number(hour));
  }

  return (
    <form className="activity-form" onSubmit={handleSubmit}>
      <p className="section-label">Check an activity</p>
      <div className="activity-form__row">
        <label>
          <span>Activity</span>
          <select value={activityType} onChange={(e) => setActivityType(e.target.value)}>
            {sortedTypes.map((type) => (
              <option key={type.key} value={type.key}>
                {type.icon} {type.label}
                {suggestedKeys.includes(type.key) ? " · suggested" : ""}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Time</span>
          <input
            type="number"
            min="0"
            max="23"
            value={hour}
            onChange={(e) => setHour(e.target.value)}
          />
        </label>
        <button type="submit">Check</button>
      </div>
    </form>
  );
}