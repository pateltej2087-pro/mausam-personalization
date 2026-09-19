import { useState } from "react";
import { createDayPlan } from "../services/api";


let plannerActivityId = 0;


export default function SmartDayPlanner({
  location,
  activityTypes,
}) {
  const [selectedType, setSelectedType] = useState(
    activityTypes[0]?.key ?? ""
  );

  const [hour, setHour] = useState(
    new Date().getHours()
  );

  const [plannedActivities, setPlannedActivities] =
    useState([]);

  const [planResult, setPlanResult] = useState(null);

  const [status, setStatus] = useState("idle");
  const [errorMessage, setErrorMessage] = useState("");


  // --------------------------------------------
  // ADD ACTIVITY
  // --------------------------------------------

  function addActivity() {
    if (!selectedType) return;

    const type = activityTypes.find(
      (item) => item.key === selectedType
    );

    if (!type) return;

    const newActivity = {
      id: plannerActivityId++,
      activity_type: selectedType,
      label: type.label,
      icon: type.icon,
      hour: Number(hour),
    };

    setPlannedActivities((previous) => [
      ...previous,
      newActivity,
    ]);

    // Existing result is now outdated.
    setPlanResult(null);
  }


  // --------------------------------------------
  // REMOVE ACTIVITY
  // --------------------------------------------

  function removeActivity(id) {
    setPlannedActivities((previous) =>
      previous.filter(
        (activity) => activity.id !== id
      )
    );

    setPlanResult(null);
  }


  // --------------------------------------------
  // BUILD DAY PLAN
  // --------------------------------------------

  async function buildPlan() {
    if (plannedActivities.length === 0) {
      setErrorMessage(
        "Add at least one activity before building your day."
      );
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const result = await createDayPlan(
        location,
        plannedActivities
      );

      setPlanResult(result);
      setStatus("ready");
    } catch (error) {
      setErrorMessage(error.message);
      setStatus("error");
    }
  }


  // --------------------------------------------
  // STATUS CLASS
  // --------------------------------------------

  function statusClass(statusName) {
    return (
      "planner-result__status " +
      `planner-result__status--${statusName.toLowerCase()}`
    );
  }


  return (
    <section className="smart-planner">

      <div className="smart-planner__heading">
        <div>
          <p className="section-label">
            Smart Day Planner
          </p>

          <h2>Plan around the weather</h2>

          <p>
            Add your activities and we'll check how
            today's weather could affect your day.
          </p>
        </div>
      </div>


      {/* -----------------------------------------
          ADD ACTIVITY FORM
      ----------------------------------------- */}

      <div className="planner-form">

        <label>
          <span>Activity</span>

          <select
            value={selectedType}
            onChange={(event) =>
              setSelectedType(event.target.value)
            }
          >
            {activityTypes.map((type) => (
              <option
                key={type.key}
                value={type.key}
              >
                {type.icon} {type.label}
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
            onChange={(event) =>
              setHour(event.target.value)
            }
          />
        </label>


        <button
          type="button"
          onClick={addActivity}
        >
          + Add
        </button>

      </div>


      {/* -----------------------------------------
          PLANNED ACTIVITIES
      ----------------------------------------- */}

      {plannedActivities.length > 0 && (

        <div className="planner-activities">

          <p className="section-label">
            Your day
          </p>

          {[...plannedActivities]
            .sort((a, b) => a.hour - b.hour)
            .map((activity) => (

              <div
                key={activity.id}
                className="planner-activity"
              >

                <div className="planner-activity__time">
                  {String(activity.hour).padStart(2, "0")}
                  :00
                </div>

                <div className="planner-activity__info">

                  <strong>
                    {activity.icon}{" "}
                    {activity.label}
                  </strong>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    removeActivity(activity.id)
                  }
                >
                  Remove
                </button>

              </div>

            ))}


          <button
            type="button"
            className="planner-build-button"
            onClick={buildPlan}
            disabled={status === "loading"}
          >

            {status === "loading"
              ? "Building your day..."
              : "Build My Smart Day"}

          </button>

        </div>
      )}


      {/* -----------------------------------------
          ERROR
      ----------------------------------------- */}

      {errorMessage && (
        <p className="planner-error">
          {errorMessage}
        </p>
      )}


      {/* -----------------------------------------
          RESULT
      ----------------------------------------- */}

      {planResult && (

        <div className="planner-result">

          <div className="planner-result__summary">

            <p className="section-label">
              Your Weather-Aware Day
            </p>

            <h3>
              {planResult.location}
            </h3>

            <p>
              {planResult.day_summary}
            </p>


            <div className="planner-summary-grid">

              <div>
                <strong>
                  {planResult.summary.good}
                </strong>
                <span>Good</span>
              </div>

              <div>
                <strong>
                  {planResult.summary.caution}
                </strong>
                <span>Caution</span>
              </div>

              <div>
                <strong>
                  {planResult.summary.warning}
                </strong>
                <span>Warnings</span>
              </div>

              <div>
                <strong>
                  {planResult.summary.reconsider}
                </strong>
                <span>Reconsider</span>
              </div>

            </div>

          </div>


          {/* -------------------------------------
              ACTIVITY RESULTS
          ------------------------------------- */}

          <div className="planner-result__timeline">

            {planResult.activities.map(
              (activity, index) => (

                <article
                  key={`${activity.activity_type}-${activity.hour}-${index}`}
                  className="planner-result__item"
                >

                  <div className="planner-result__time">
                    {activity.hour}
                  </div>


                  <div className="planner-result__content">

                    <div className="planner-result__top">

                      <h4>
                        {activity.icon}{" "}
                        {activity.activity_label}
                      </h4>

                      <span
                        className={statusClass(
                          activity.planner_status
                        )}
                      >
                        {activity.planner_status}
                      </span>

                    </div>


                    <div className="planner-result__score">
                      Suitability{" "}
                      <strong>
                        {activity.score}/100
                      </strong>
                    </div>


                    <p className="planner-result__action">
                      {activity.action_message}
                    </p>


                    {/* WARNINGS */}

                    {activity.warnings.length > 0 && (

                      <div className="planner-warning">

                        {activity.warnings.map(
                          (warning) => (

                            <div key={warning.id}>

                              <strong>
                                ⚠️ {warning.title}
                              </strong>

                              <p>
                                {warning.message}
                              </p>

                              <small>
                                {warning.severity} ·{" "}
                                {warning.start_hour}:00–
                                {warning.end_hour}:00
                              </small>

                            </div>

                          )
                        )}

                      </div>
                    )}


                    {/* BETTER WINDOW */}

                    {activity.better_window && (

                      <div className="planner-better-window">

                        <strong>
                          💡 Better time
                        </strong>

                        <p>
                          {
                            activity
                              .better_window
                              .reason
                          }
                        </p>

                      </div>

                    )}


                    {/* BREAKDOWN */}

                    <details className="planner-breakdown">

                      <summary>
                        Why this recommendation?
                      </summary>

                      <ul>

                        {activity.factor_breakdown.map(
                          (factor) => (

                            <li key={factor.factor}>

                              <strong>
                                {factor.factor}
                              </strong>

                              {" — "}

                              {factor.score}/100

                              <br />

                              <span>
                                {factor.reason}
                              </span>

                            </li>

                          )
                        )}

                      </ul>

                    </details>

                  </div>

                </article>

              )
            )}

          </div>


          <p className="planner-demo-note">
            Weather and warnings shown here are
            DEMO / SIMULATED data for the SIH prototype.
          </p>

        </div>

      )}

    </section>
  );
}