const FACTOR_ICONS = {
  temperature: "🌡️",
  rain: "🌧️",
  aqi: "🌫️",
  wind: "💨",
  visibility: "👁️",
  humidity: "💧",
};

const SEVERITY_LABELS = {
  high: "Important",
  medium: "Noticeable",
  low: "Minor",
};


function formatCheckTime(timestamp) {
  if (!timestamp) {
    return "";
  }

  // Backend database timestamps are stored in UTC.
  // If the timestamp has no timezone marker,
  // explicitly treat it as UTC.
  const hasTimezone =
    timestamp.endsWith("Z") ||
    /[+-]\d{2}:\d{2}$/.test(timestamp);

  const utcTimestamp = hasTimezone
    ? timestamp
    : `${timestamp}Z`;

  const date = new Date(utcTimestamp);

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
}


export default function WhatChangedCard({ data }) {
  if (!data) {
    return null;
  }

  // =========================================
  // FIRST CHECK
  // =========================================

  if (!data.has_previous_check) {
    return (
      <section className="changes-card">

        <div className="changes-card__header">
          <div>
            <p className="section-label">
              Weather updates
            </p>

            <h3>What Changed?</h3>
          </div>
        </div>

        <div className="changes-card__stable">
          <span>ℹ️</span>

          <div>
            <strong>
              First weather check
            </strong>

            <p>
              We'll compare conditions the next time
              you check {data.location}.
            </p>
          </div>
        </div>

      </section>
    );
  }

  const hasChanges =
    data.changes && data.changes.length > 0;

  const previousTime =
    formatCheckTime(data.previous_check_time);

  const currentTime =
    formatCheckTime(data.current_check_time);

  return (
    <section className="changes-card">

      {/* HEADER */}

      <div className="changes-card__header">

        <div>
          <p className="section-label">
            Since your last check
          </p>

          <h3>What Changed?</h3>
        </div>

        {previousTime && currentTime && (
          <span className="changes-card__time">
          {previousTime} → {currentTime}
        </span>
)}

      </div>

      {/* NO MEANINGFUL CHANGES */}

      {!hasChanges && (
        <div className="changes-card__stable">

          <span>✓</span>

          <div>
            <strong>
              No major weather changes
            </strong>

            <p>
              Conditions are broadly similar to your
              previous check.
            </p>
          </div>

        </div>
      )}

      {/* WEATHER CHANGES */}

      {hasChanges && (
        <div className="changes-card__list">

          {data.changes.map((change, index) => (

            <div
              key={`${change.factor}-${index}`}
              className={
                `change-item change-item--${change.severity}`
              }
            >

              <span className="change-item__icon">
                {FACTOR_ICONS[change.factor] ?? "☁️"}
              </span>

              <div className="change-item__content">

                <div className="change-item__top">

                  <strong>
                    {change.factor
                      .charAt(0)
                      .toUpperCase() +
                      change.factor.slice(1)}
                  </strong>

                  <span className="change-item__severity">
                    {SEVERITY_LABELS[
                      change.severity
                    ] ?? change.severity}
                  </span>

                </div>

                <p>
                  {change.message}
                </p>

              </div>

            </div>

          ))}

        </div>
      )}

      {/* ACTIVITY IMPACT */}

      {data.activity_impact && (

        <div
          className={
            `activity-impact activity-impact--${
              data.activity_impact.impact.toLowerCase()
            }`
          }
        >

          <p className="activity-impact__eyebrow">
            Impact on your plan
          </p>

          <strong>
            {data.activity_impact.icon}{" "}
            {data.activity_impact.activity_label}
          </strong>

          <div className="activity-impact__scores">

            <span>
              {data.activity_impact.previous_score}/100
            </span>

            <span className="activity-impact__arrow">
              →
            </span>

            <span>
              {data.activity_impact.current_score}/100
            </span>

          </div>

          <p>
            {data.activity_impact.message}
          </p>

        </div>

      )}

      {/* TIME INFORMATION */}

      <div className="changes-card__footer">

        {previousTime && currentTime && (
          <p>
            Compared {previousTime} → {currentTime}
          </p>
        )}

        <p className="changes-card__source">
          Source: {data.source}
          {data.is_demo_data
            ? " · simulated prototype data"
            : ""}
        </p>

      </div>

    </section>
  );
}