const IMPACT_ICONS = {
  HIGH: "🔴",
  MEDIUM: "🟠",
  LOW: "🟡",
  NONE: "🟢",
};

const WARNING_ICONS = {
  heat: "🌡️",
  thunderstorm: "⛈️",
  heavy_rain: "🌧️",
  rain: "🌧️",
  strong_wind: "💨",
  wind: "💨",
  poor_air_quality: "😷",
  air_quality: "😷",
};

function formatTime(time) {
  if (
    time === null ||
    time === undefined
  ) {
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

  return `${String(
    displayHour
  ).padStart(2, "0")}:00 ${period}`;
}

export default function WarningImpactCard({
  result,
}) {
  if (!result) {
    return null;
  }

  const warnings =
    result.warnings || [];

  const matches =
    result.matches || [];

  const affectedCount =
    result.affected_activity_count ?? 0;

  const highestImpact =
    result.highest_impact || "NONE";

  const impactIcon =
    IMPACT_ICONS[highestImpact] ?? "⚪";


  // ==========================================
  // COUNT UNIQUE AFFECTED ACTIVITIES
  // ==========================================

  const uniqueAffectedActivities =
    new Set(
      matches.map(
        (match) =>
          `${match.activity_type}-${match.activity_hour}`
      )
    ).size;


  const finalAffectedCount =
    affectedCount ||
    uniqueAffectedActivities;


  return (
    <section className="warning-impact">

      {/* =====================================
          HEADER
      ====================================== */}

      <div className="warning-impact__header">

        <div>

          <p className="section-label">
            WEATHER WARNING INTELLIGENCE
          </p>

          <h3>
            Today's Warning Overview
          </h3>

        </div>


        <span
          className={`warning-impact__level warning-impact__level--${highestImpact.toLowerCase()}`}
        >
          {impactIcon} {highestImpact}
        </span>

      </div>


      {/* =====================================
          PERSONAL IMPACT SUMMARY
      ====================================== */}

      <div className="warning-impact__personal-summary">

        {finalAffectedCount > 0 ? (

          <>
            <strong>
              {finalAffectedCount}{" "}
              {finalAffectedCount === 1
                ? "planned activity is"
                : "planned activities are"}{" "}
              affected by today's warnings.
            </strong>

            <p>
              The activity cards above already
              include the specific impact and
              recommended action for each affected
              plan.
            </p>
          </>

        ) : (

          <>
            <strong>
              ✓ Your current plans do not overlap
              important weather warnings.
            </strong>

            <p>
              Warnings may still exist for your
              location, but they do not currently
              affect the activities in your
              schedule.
            </p>
          </>

        )}

      </div>


      {/* =====================================
          ACTIVE WARNING WINDOWS
      ====================================== */}

      {warnings.length > 0 ? (

        <div className="warning-impact__warnings">

          <p className="warning-impact__matches-title">
            Warning windows
          </p>


          {warnings.map((warning) => {

            const warningIcon =
              WARNING_ICONS[
                warning.type
              ] ?? "⚠️";

            return (

              <div
                key={warning.id}
                className="warning-impact__warning"
              >

                <div className="warning-impact__warning-icon">
                  {warningIcon}
                </div>


                <div>

                  <strong>
                    {warning.title}
                  </strong>

                  <p>
  {formatTime(warning.start_hour)}
  {" → "}
  {formatTime(warning.end_hour)}
  {" · "}
  {warning.severity}
  {" warning"}
</p>

                </div>

              </div>

            );

          })}

        </div>

      ) : (

        <div className="warning-impact__safe">

          <strong>
            ✓ No active warning windows
          </strong>

          <p>
            No weather warnings are currently
            included for this location.
          </p>

        </div>

      )}


      {/* =====================================
          SHORT AFFECTED PLAN SUMMARY
      ====================================== */}

      {matches.length > 0 && (

        <div className="warning-impact__affected-summary">

          <p className="warning-impact__matches-title">
            Schedule overlap
          </p>


          <div className="warning-impact__affected-list">

            {matches.map(
              (match, index) => {

                const warningIcon =
                  WARNING_ICONS[
                    match.warning_type
                  ] ?? "⚠️";

                const matchImpactIcon =
                  IMPACT_ICONS[
                    match.impact
                  ] ?? "⚪";


                return (

                  <div
                    key={`${match.warning_id}-${match.activity_type}-${match.activity_hour}-${index}`}
                    className="warning-impact__affected-row"
                  >

                    <span>
                      {match.activity_icon}{" "}
                      {match.activity_label}
                      {" · "}
                      {formatTime(match.activity_hour)}
                    </span>

                    <span>
                      {warningIcon}{" "}
                      {match.warning_title}
                    </span>


                    <strong>
                      {matchImpactIcon}{" "}
                      {match.impact}
                    </strong>

                  </div>

                );

              }
            )}

          </div>

        </div>

      )}


      {/* =====================================
          SOURCE
      ====================================== */}

      <p className="warning-impact__source">

        Source: {result.source}

        {result.is_demo_data
          ? " · Simulated warnings for prototype testing — not live IMD warnings"
          : ""}

      </p>

    </section>
  );
}