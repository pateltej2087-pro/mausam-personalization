const LABEL_STYLES = {
  GOOD: {
    color: "var(--color-good)",
    dot: "🟢",
  },

  MODERATE: {
    color: "var(--color-moderate)",
    dot: "🟡",
  },

  POOR: {
    color: "var(--color-warning)",
    dot: "🔴",
  },
};


const DECISION_STYLES = {
  GREEN: {
    color: "var(--color-good)",
  },

  YELLOW: {
    color: "var(--color-moderate)",
  },

  ORANGE: {
    color: "var(--color-moderate)",
  },

  RED: {
    color: "var(--color-warning)",
  },
};


function formatTime(time) {
  if (time === null || time === undefined) {
    return "";
  }

  const hour = Number(
    String(time).split(":")[0]
  );

  if (Number.isNaN(hour)) {
    return time;
  }

  const period =
    hour >= 12 ? "PM" : "AM";

  const displayHour =
    hour % 12 || 12;

  return `${String(displayHour).padStart(
    2,
    "0"
  )}:00 ${period}`;
}


export default function ActivityScoreCard({
  result,
  onRemove,
}) {
  const suitabilityStyle =
    LABEL_STYLES[result.label] ??
    LABEL_STYLES.MODERATE;

  const decision =
    result.final_decision;

  const decisionStyle =
    DECISION_STYLES[
      decision?.level
    ] ?? DECISION_STYLES.YELLOW;

  const warning =
    result.warning;

  const safeWindow =
    result.safe_better_window;


  return (
    <article className="activity-card">

      {/* ===================================== */}
      {/* HEADER */}
      {/* ===================================== */}

      <header className="activity-card__header">

        <div>

          <p className="activity-card__title">
            {result.icon}{" "}
            {result.activity_label}
            {" · "}
            {formatTime(result.hour)}
          </p>

        </div>


        <button
          type="button"
          className="activity-card__remove"
          onClick={onRemove}
        >
          Remove
        </button>

      </header>


      {/* ===================================== */}
      {/* WEATHER SUITABILITY */}
      {/* ===================================== */}

      <div className="activity-card__section">

        <p className="activity-card__section-label">
          WEATHER SUITABILITY
        </p>

        <p
          className="activity-card__score"
          style={{
            color:
              suitabilityStyle.color,
          }}
        >
          {suitabilityStyle.dot}{" "}
          {result.score}/100 —{" "}
          {result.label}
        </p>

      </div>


      {/* ===================================== */}
      {/* WARNING */}
      {/* ===================================== */}

      {warning &&
        warning.impact !== "NONE" && (

          <div className="activity-card__warning">

            <p className="activity-card__section-label">
              ⚠️ WEATHER WARNING
            </p>

            <p>
              <strong>
                {warning.title ??
                  "Weather Warning"}
              </strong>
            </p>

            <p>
              Impact:{" "}
              <strong>
                {warning.impact}
              </strong>
            </p>

          </div>

        )}


      {/* ===================================== */}
      {/* FINAL RECOMMENDATION */}
      {/* ===================================== */}

      {decision && (

        <div className="activity-card__decision">

          <p className="activity-card__section-label">
            FINAL RECOMMENDATION
          </p>

          <p
            className="activity-card__final-status"
            style={{
              color:
                decisionStyle.color,
            }}
          >
            {decision.icon}{" "}
            <strong>
              {decision.status}
            </strong>
          </p>


          <div className="activity-card__decision-text">

            <p>
              <strong>Why?</strong>
            </p>

            <p>
              {decision.reason}
            </p>


            <p>
              <strong>
                What should I do?
              </strong>
            </p>

            <p>
              {decision.action}
            </p>

          </div>

        </div>

      )}


      {/* ===================================== */}
      {/* NORMAL EXPLANATION */}
      {/* ===================================== */}

      <ul className="activity-card__explanation">

        {result.explanation.map(
          (line, index) => (

            <li key={index}>
              {line}
            </li>

          )
        )}

      </ul>


      {/* ===================================== */}
      {/* FACTOR BREAKDOWN */}
      {/* ===================================== */}

      <details className="activity-card__breakdown">

        <summary>
          Why this score?
        </summary>

        <ul>

          {result.factor_breakdown.map(
            (item) => (

              <li key={item.factor}>

                <span className="activity-card__factor">

                  {item.factor}
                  {" "}
                  ({item.weight_percent}% weight)

                </span>

                <span>
                  {item.score}/100
                  {" — "}
                  {item.reason}
                </span>

              </li>

            )
          )}

        </ul>

      </details>


      {/* ===================================== */}
      {/* WARNING-AWARE SAFER TIME */}
      {/* ===================================== */}

      {safeWindow && (

        <div className="activity-card__better-window">

          <p className="activity-card__better-window-title">
            Safer time available
          </p>


          {safeWindow.earlier && (

            <p>
              <strong>Earlier:</strong>{" "}
              {formatTime(
                safeWindow.earlier
                  .suggested_hour
              )}
              {" — "}
              {
                safeWindow.earlier
                  .suggested_score
              }
              /100{" "}
              (
              {
                safeWindow.earlier
                  .suggested_label
              }
              )
            </p>

          )}


          {safeWindow.later && (

            <p>
              <strong>Later:</strong>{" "}
              {formatTime(
                safeWindow.later
                  .suggested_hour
              )}
              {" — "}
              {
                safeWindow.later
                  .suggested_score
              }
              /100{" "}
              (
              {
                safeWindow.later
                  .suggested_label
              }
              )
            </p>

          )}


          {!safeWindow.earlier &&
            !safeWindow.later && (

              <p>
                {safeWindow.reason}
              </p>

            )}

        </div>

      )}

    </article>
  );
}