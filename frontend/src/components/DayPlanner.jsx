import { useState } from "react";


export default function DayPlanner({
  activityTypes,
  plannedActivities,
  setPlannedActivities,
  onEvaluate,
  loading,
}) {
  const [activityType, setActivityType] =
    useState(activityTypes[0]?.key ?? "");

  const [hour, setHour] = useState(
    new Date().getHours()
  );


  // ==========================================
  // ADD ACTIVITY TO DAY
  // ==========================================

  function handleAdd() {
    if (!activityType) {
      return;
    }

    const selectedType = activityTypes.find(
      (item) => item.key === activityType
    );

    if (!selectedType) {
      return;
    }

    const newActivity = {
      id: Date.now(),
      activity_type: activityType,
      activity_label: selectedType.label,
      icon: selectedType.icon,
      hour: Number(hour),
    };

    setPlannedActivities((previous) => [
      ...previous,
      newActivity,
    ]);
  }


  // ==========================================
  // REMOVE ACTIVITY
  // ==========================================

  function handleRemove(id) {
    setPlannedActivities((previous) =>
      previous.filter(
        (activity) => activity.id !== id
      )
    );
  }


  // ==========================================
  // LOAD DEMO SCENARIO
  // ==========================================

  function handleLoadDemo() {
    const demoPlan = [
      {
        activity_type: "college_commute",
        hour: 8,
      },
      {
        activity_type: "outdoor_event",
        hour: 13,
      },
      {
        activity_type: "cricket",
        hour: 17,
      },
      {
        activity_type: "walking",
        hour: 20,
      },
    ];


    const demoActivities = demoPlan
      .map((demo, index) => {

        const type =
          activityTypes.find(
            (item) =>
              item.key ===
              demo.activity_type
          );

        if (!type) {
          return null;
        }


        return {
          id:
            Date.now() +
            index,

          activity_type:
            demo.activity_type,

          activity_label:
            type.label,

          icon:
            type.icon,

          hour:
            demo.hour,
        };

      })
      .filter(Boolean);


    setPlannedActivities(
      demoActivities
    );
  }


  // ==========================================
  // CLEAR PLAN
  // ==========================================

  function handleClearPlan() {
    setPlannedActivities([]);
  }


  // ==========================================
  // EVALUATE WHOLE DAY
  // ==========================================

  function handleEvaluate() {
    if (
      plannedActivities.length === 0
    ) {
      return;
    }

    const payload =
      plannedActivities.map(
        (activity) => ({
          activity_type:
            activity.activity_type,

          hour:
            activity.hour,
        })
      );

    onEvaluate(payload);
  }


  // ==========================================
  // FORMAT HOUR
  // ==========================================

  function formatHour(value) {
    const numericHour =
      Number(value);

  const period =
    numericHour >= 12
      ? "PM"
      : "AM";

  const displayHour =
    numericHour % 12 || 12;

  return `${String(
    displayHour
  ).padStart(2, "0")}:00 ${period}`;
}


  return (
    <section className="day-planner">

      {/* =====================================
          HEADER
      ====================================== */}

      <div className="day-planner__heading">

        <div>

          <p className="section-label">
            Personalized schedule
          </p>

          <h3>
            Plan My Day
          </h3>

        </div>


        <span className="day-planner__count">

          {plannedActivities.length}{" "}

          {plannedActivities.length === 1
            ? "activity"
            : "activities"}

        </span>

      </div>


      <p className="day-planner__intro">

        Add what you're planning today and
        Mausam will check the weather for
        your whole day.

      </p>


      {/* =====================================
          DEMO SCENARIO
      ====================================== */}

      <div className="day-planner__demo">

        <div>

          <strong>
            🎬 Quick Demo
          </strong>

          <p>
            Load a sample student's day to
            demonstrate personalized weather
            planning and smart rescheduling.
          </p>

        </div>


        <button
          type="button"
          className="day-planner__demo-button"
          onClick={handleLoadDemo}
          disabled={loading}
        >
          Load Demo Scenario
        </button>

      </div>


      {/* =====================================
          ADD ACTIVITY
      ====================================== */}

      <div className="day-planner__form">

        <label>

          <span>
            Activity
          </span>

          <select
            value={activityType}
            onChange={(event) =>
              setActivityType(
                event.target.value
              )
            }
          >

            {activityTypes.map(
              (type) => (

                <option
                  key={type.key}
                  value={type.key}
                >
                  {type.icon}{" "}
                  {type.label}
                </option>

              )
            )}

          </select>

        </label>


        <label className="day-planner__time">

          <span>
            Time
          </span>

          <input
            type="number"
            min="0"
            max="23"
            value={hour}
            onChange={(event) =>
              setHour(
                event.target.value
              )
            }
          />

        </label>


        <button
          type="button"
          onClick={handleAdd}
        >
          + Add
        </button>

      </div>


      {/* =====================================
          PLANNED ACTIVITIES
      ====================================== */}

      {plannedActivities.length > 0 && (

        <div className="day-planner__activities">

          {plannedActivities.map(
            (activity, index) => (

              <div
                key={activity.id}
                className="day-planner__activity"
              >

                <div className="day-planner__activity-number">
                  {index + 1}
                </div>


                <div className="day-planner__activity-main">

                  <strong>
                    {activity.icon}{" "}
                    {activity.activity_label}
                  </strong>

                  <span>
                    {formatHour(
                      activity.hour
                    )}
                  </span>

                </div>


                <button
                  type="button"
                  className="day-planner__remove"
                  onClick={() =>
                    handleRemove(
                      activity.id
                    )
                  }
                >
                  Remove
                </button>

              </div>

            )
          )}

        </div>

      )}


      {/* =====================================
          ACTION BUTTONS
      ====================================== */}

      {plannedActivities.length > 0 && (

        <div className="day-planner__actions">

          <button
            type="button"
            className="day-planner__clear"
            onClick={handleClearPlan}
            disabled={loading}
          >
            Clear Plan
          </button>


          <button
            type="button"
            className="day-planner__evaluate"
            onClick={handleEvaluate}
            disabled={loading}
          >

            {loading
              ? "Analysing your day..."
              : "Analyse My Day"}

          </button>

        </div>

      )}

    </section>
  );
}