function DayPlanResult({
  data,
  onUseBetterWindow,
  loading,
}) {
  if (!data) {
    return null;
  }

  const recommendations =
    data.recommendations || [];

  const plannerActivities =
    data.planner?.activities ||
    data.activities ||
    [];

  const profile = data.profile;


  // ==========================================
  // FIND MATCHING PLANNER ACTIVITY
  // ==========================================

  function getPlannerActivity(
    recommendation
  ) {
    return plannerActivities.find(
      (activity) =>
        activity.activity_type ===
          recommendation.activity_type &&
        activity.hour === recommendation.hour
    );
  }


  // ==========================================
  // LEVEL CLASS
  // ==========================================

  function getLevelClass(level) {
    return String(
      level || "green"
    ).toLowerCase();
  }


  // ==========================================
  // SUITABILITY CLASS
  // ==========================================

  function getSuitabilityClass(label) {
    return String(
      label || "good"
    ).toLowerCase();
  }


  // ==========================================
  // FORMAT TIME TO AM / PM
  // ==========================================

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


  // ==========================================
  // WARNING ICON
  // ==========================================

  function getWarningIcon(type) {
    const icons = {
      heat: "🔥",
      thunderstorm: "⛈️",

      rain: "🌧️",
      heavy_rain: "🌧️",

      wind: "💨",
      strong_wind: "💨",

      fog: "🌫️",

      air_quality: "😷",
      poor_air_quality: "😷",
    };

    return icons[type] || "⚠️";
  }


  // ==========================================
  // FACTOR NAME
  // ==========================================

  function formatFactorName(factor) {
    const names = {
      temperature: "Temperature",
      humidity: "Humidity",
      rain: "Rain",
      wind: "Wind",
      aqi: "Air Quality",
      visibility: "Visibility",
    };

    return names[factor] || factor;
  }


  // ==========================================
  // PROFILE EXPLANATION
  // ==========================================

  function getProfileExplanation(profileKey) {
    const explanations = {
      student:
        "Rain, visibility and air quality receive additional priority for college travel and everyday outdoor plans.",

      commuter:
        "Rain and visibility receive additional priority because they can strongly affect daily travel conditions.",

      fitness:
        "Temperature, humidity and air quality receive additional priority for outdoor physical activity.",

      traveller:
        "Rain and visibility receive additional priority for outdoor travel and sightseeing plans.",

      farmer_gardener:
        "Rain, temperature, humidity and wind receive additional priority for outdoor agricultural and gardening work.",

      parent:
        "Temperature, rain and air quality receive additional priority when evaluating outdoor family activities.",

      health_conscious:
        "Air quality, temperature and humidity receive additional priority for your weather suitability scores.",

      event_planner:
        "Rain and wind receive additional priority because they can significantly affect outdoor events.",

      beach_coastal:
        "Wind and rain receive additional priority for beach and coastal activities.",
    };

    return (
      explanations[profileKey] ||
      "Weather factors are weighted according to your selected profile."
    );
  }


  return (
    <section className="day-result">

      {/* =====================================
          HEADER
      ====================================== */}

      <div className="day-result__header">

        <p className="day-result__eyebrow">
          PERSONALIZED DAY PLAN
        </p>

        <h2>
          Your Day at a Glance
        </h2>

        <p className="day-result__subtitle">
          Weather suitability and warnings are
          combined to show what today's conditions
          mean for your plans.
        </p>

      </div>


      {/* =====================================
          PROFILE
      ====================================== */}

      {profile && (

        <div className="day-result__profile">

          <div className="day-result__profile-icon">
            {profile.icon}
          </div>

          <div>

            <span className="day-result__small-label">
              PERSONALIZED FOR YOU
            </span>

            <h3>
              {profile.icon} {profile.label}
            </h3>

            <p>
              {getProfileExplanation(
                profile.key
              )}
            </p>

          </div>

        </div>

      )}


      {/* =====================================
          OVERALL STATUS
      ====================================== */}

      <div
        className={`day-result__overall day-result__overall--${getLevelClass(
          data.overall_level
        )}`}
      >

        <div className="day-result__overall-icon">
          {data.overall_icon || "🟢"}
        </div>

        <div>

          <span className="day-result__overall-label">
            TODAY'S PLAN
          </span>

          <h3>
            {data.overall_status || "READY"}
          </h3>

          <p>
            {data.overall_summary}
          </p>

        </div>

      </div>


      {/* =====================================
          ACTIVITY CARDS
      ====================================== */}

      <div className="day-result__list">

        {recommendations.map(
          (item, index) => {

            const level =
              getLevelClass(
                item.final_level
              );

            const suitability =
              getSuitabilityClass(
                item.suitability_label
              );

            const warnings =
              item.active_warnings || [];

            const plannerActivity =
              getPlannerActivity(item);

            const factors =
              plannerActivity
                ?.factor_breakdown || [];

            const personalization =
              plannerActivity
                ?.personalization;

            const prioritizedFactors =
              personalization
                ?.prioritized_factors || [];

            const betterWindow =
              item.better_window;

            const earlierWindow =
              betterWindow?.earlier;

            const laterWindow =
              betterWindow?.later;


            return (

              <article
                key={`${item.activity_type}-${item.hour}-${index}`}
                className={`day-result__card day-result__card--${level}`}
              >

                {/* =============================
                    ACTIVITY HEADER
                ============================== */}

                <div className="day-result__card-header">

                  <div className="day-result__activity">

                    <div className="day-result__activity-icon">
                      {item.icon}
                    </div>

                    <div>

                      <h3>
                        {item.activity_label}
                      </h3>

                      <span className="day-result__time">
                        {formatTime(
                          item.hour
                        )}
                      </span>

                    </div>

                  </div>


                  <span
                    className={`day-result__decision-badge day-result__decision-badge--${level}`}
                  >
                    {item.final_icon}
                    {" "}
                    {item.final_status}
                  </span>

                </div>


                {/* =============================
                    WEATHER SUITABILITY
                ============================== */}

                <div className="day-result__suitability">

                  <div>

                    <span className="day-result__small-label">
                      WEATHER SUITABILITY
                    </span>

                    <div className="day-result__score-row">

                      <strong>
                        {item.suitability_score}
                        /100
                      </strong>

                      <span
                        className={`day-result__suitability-label day-result__suitability-label--${suitability}`}
                      >
                        {item.suitability_label}
                      </span>

                    </div>

                  </div>


                  <p className="day-result__score-note">
                    Personalized using temperature,
                    humidity, rain, wind, air quality
                    and visibility.
                  </p>

                </div>


                {/* =============================
                    WHY PERSONALIZED FOR YOU
                ============================== */}

                {personalization?.applied && (

                  <div className="day-result__personalization">

                    <div className="day-result__personalization-heading">

                      <span className="day-result__personalization-icon">
                        ✨
                      </span>

                      <div>

                        <span className="day-result__small-label">
                          WHY PERSONALIZED FOR YOU?
                        </span>

                        <strong>
                          {
                            personalization
                              .profile_label
                          }
                          {" "}
                          profile applied
                        </strong>

                      </div>

                    </div>


                    <p className="day-result__personalization-summary">
                      {personalization.summary}
                    </p>


                    {prioritizedFactors.length > 0 && (

                      <div className="day-result__personalization-factors">

                        {prioritizedFactors.map(
                          (factor) => (

                            <div
                              key={factor.factor}
                              className="day-result__personalization-factor"
                            >

                              <span>
                                {factor.label}
                              </span>


                              <div>

                                <small>
                                  {
                                    factor
                                      .base_weight_percent
                                  }
                                  %
                                </small>

                                <span>
                                  →
                                </span>

                                <strong>
                                  {
                                    factor
                                      .personalized_weight_percent
                                  }
                                  %
                                </strong>

                              </div>

                            </div>

                          )
                        )}

                      </div>

                    )}

                  </div>

                )}


                {/* =============================
                    WHY THIS SCORE
                ============================== */}

                {factors.length > 0 && (

                  <details className="day-result__factors">

                    <summary className="day-result__factors-summary">

                      <span className="day-result__factors-arrow">
                        ›
                      </span>

                      <span>
                        Why this score?
                      </span>

                    </summary>


                    <div className="day-result__factor-list">

                      {factors.map(
                        (
                          factor,
                          factorIndex
                        ) => (

                          <div
                            key={`${factor.factor}-${factorIndex}`}
                            className="day-result__factor"
                          >

                            <div className="day-result__factor-top">

                              <strong>
                                {formatFactorName(
                                  factor.factor
                                )}
                              </strong>


                              <div className="day-result__factor-values">

                                <span>
                                  {factor.score}
                                  /100
                                </span>

                                <small>
                                  {
                                    factor
                                      .weight_percent
                                  }
                                  % weight
                                </small>

                              </div>

                            </div>


                            <div className="day-result__factor-track">

                              <div
                                className="day-result__factor-fill"
                                style={{
                                  width: `${Math.max(
                                    0,
                                    Math.min(
                                      100,
                                      factor.score
                                    )
                                  )}%`,
                                }}
                              />

                            </div>


                            <p>
                              {factor.reason}
                            </p>

                          </div>

                        )
                      )}

                    </div>

                  </details>

                )}


                {/* =============================
                    WARNINGS
                ============================== */}

                {warnings.length > 0 && (

                  <div className="day-result__warning">

                    <div className="day-result__warning-heading">

                      <span>
                        ⚠️
                      </span>

                      <strong>

                        {warnings.length}{" "}

                        {warnings.length === 1
                          ? "warning affects"
                          : "warnings affect"}{" "}

                        this activity

                      </strong>

                    </div>


                    <div className="day-result__warning-list">

                      {warnings.map(
                        (
                          warning,
                          warningIndex
                        ) => (

                          <div
                            key={`${warning.warning_id}-${warningIndex}`}
                            className="day-result__warning-item"
                          >

                            <div className="day-result__warning-name">

                              <span>
                                {getWarningIcon(
                                  warning.type
                                )}
                              </span>

                              <div>

                                <strong>
                                  {warning.title}
                                </strong>

                                <small>
                                  {warning.severity}
                                  {" "}
                                  warning
                                </small>

                              </div>

                            </div>


                            <span
                              className={`day-result__impact day-result__impact--${String(
                                warning.impact
                              ).toLowerCase()}`}
                            >
                              {warning.impact}
                              {" "}
                              impact
                            </span>

                          </div>

                        )
                      )}

                    </div>

                  </div>

                )}


                {/* =============================
                    WHY FINAL DECISION
                ============================== */}

                <div className="day-result__decision">

                  <span className="day-result__small-label">
                    WHY?
                  </span>

                  <p>
                    {item.reason}
                  </p>

                </div>


                {/* =============================
                    ACTION
                ============================== */}

                <div className="day-result__action">

                  <span className="day-result__small-label">
                    WHAT SHOULD I DO?
                  </span>

                  <p>
                    {item.action}
                  </p>

                </div>


                {/* =============================
                    SAFER TIME OPTIONS
                ============================== */}

                {betterWindow && (

                  <div className="day-result__better">

                    <div className="day-result__better-icon">
                      ↗
                    </div>


                    <div className="day-result__better-content">

                      <span className="day-result__small-label">
                        {earlierWindow || laterWindow
                          ? "SAFER TIME OPTIONS"
                          : "SAFER BETTER WINDOW"}
                      </span>


                      {(earlierWindow || laterWindow) && (

                        <p>
                          Choose a safer time that fits
                          your schedule.
                        </p>

                      )}


                      {/* =========================
                          EARLIER OPTION
                      ========================== */}

                      {earlierWindow && (

                        <div className="day-result__better-option">

                          <div className="day-result__better-option-heading">

                            <strong>
                              🌅 Earlier
                            </strong>

                            <span>
                              Before your current plan
                            </span>

                          </div>


                          <div className="day-result__better-main">

                            <strong>
                              {formatTime(
                                earlierWindow
                                  .suggested_hour
                              )}
                            </strong>

                            <span>
                              {
                                earlierWindow
                                  .suggested_score
                              }
                              /100
                            </span>

                            <span className="day-result__better-label">
                              {
                                earlierWindow
                                  .suggested_label
                              }
                            </span>

                          </div>


                          <p>
                            {earlierWindow.reason}
                          </p>


                          <button
                            type="button"
                            className="day-result__better-button"
                            disabled={loading}
                            onClick={() =>
                              onUseBetterWindow?.(
                                item.activity_type,
                                item.hour,
                                earlierWindow
                                  .suggested_hour
                              )
                            }
                          >

                            {loading
                              ? "Updating..."
                              : `✓ Use ${formatTime(
                                  earlierWindow
                                    .suggested_hour
                                )} instead`}

                          </button>

                        </div>

                      )}


                      {/* =========================
                          LATER OPTION
                      ========================== */}

                      {laterWindow && (

                        <div className="day-result__better-option">

                          <div className="day-result__better-option-heading">

                            <strong>
                              🌙 Later
                            </strong>

                            <span>
                              After your current plan
                            </span>

                          </div>


                          <div className="day-result__better-main">

                            <strong>
                              {formatTime(
                                laterWindow
                                  .suggested_hour
                              )}
                            </strong>

                            <span>
                              {
                                laterWindow
                                  .suggested_score
                              }
                              /100
                            </span>

                            <span className="day-result__better-label">
                              {
                                laterWindow
                                  .suggested_label
                              }
                            </span>

                          </div>


                          <p>
                            {laterWindow.reason}
                          </p>


                          <button
                            type="button"
                            className="day-result__better-button"
                            disabled={loading}
                            onClick={() =>
                              onUseBetterWindow?.(
                                item.activity_type,
                                item.hour,
                                laterWindow
                                  .suggested_hour
                              )
                            }
                          >

                            {loading
                              ? "Updating..."
                              : `✓ Use ${formatTime(
                                  laterWindow
                                    .suggested_hour
                                )} instead`}

                          </button>

                        </div>

                      )}


                      {/* =========================
                          OLD BACKEND FALLBACK
                      ========================== */}

                      {!earlierWindow &&
                        !laterWindow && (

                        <>

                          <div className="day-result__better-main">

                            <strong>
                              {formatTime(
                                betterWindow
                                  .suggested_hour
                              )}
                            </strong>

                            <span>
                              {
                                betterWindow
                                  .suggested_score
                              }
                              /100
                            </span>

                            <span className="day-result__better-label">
                              {
                                betterWindow
                                  .suggested_label
                              }
                            </span>

                          </div>


                          <p>
                            {betterWindow.reason}
                          </p>


                          <button
                            type="button"
                            className="day-result__better-button"
                            disabled={loading}
                            onClick={() =>
                              onUseBetterWindow?.(
                                item.activity_type,
                                item.hour,
                                betterWindow
                                  .suggested_hour
                              )
                            }
                          >

                            {loading
                              ? "Updating..."
                              : `✓ Use ${formatTime(
                                  betterWindow
                                    .suggested_hour
                                )} instead`}

                          </button>

                        </>

                      )}

                    </div>

                  </div>

                )}

              </article>

            );

          }
        )}

      </div>

    </section>
  );
}


export default DayPlanResult;