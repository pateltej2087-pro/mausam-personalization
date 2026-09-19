import { useEffect, useState } from "react";

import CurrentWeatherHero from "./components/CurrentWeatherHero";
import LocationSelector from "./components/LocationSelector";
import DemoDataBadge from "./components/DemoDataBadge";
import ProfileSelector from "./components/ProfileSelector";
import ActivityForm from "./components/ActivityForm";
import ActivityScoreCard from "./components/ActivityScoreCard";
import WhatChangedCard from "./components/WhatChangedCard";
import DayPlanner from "./components/DayPlanner";
import DayPlanResult from "./components/DayPlanResult";
import WarningImpactCard from "./components/WarningImpactCard";
import AskMausam from "./components/AskMausam";
import SunriseSunsetCard from "./components/SunriseSunsetCard";
import UVIndexCard from "./components/UVIndexCard";
import TravelerPackingCard from "./components/TravelerPackingCard";
import EventComfortCard from "./components/EventComfortCard";
import ProfileDailyInsight from "./components/ProfileDailyInsight";

import {
  fetchCurrentWeather,
  fetchSupportedLocations,
  fetchProfiles,
  fetchActivityTypes,
  scoreActivity,
  fetchWeatherChanges,
  fetchPersonalizedDay,
} from "./services/api";

import "./App.css";


let activityIdCounter = 0;


// ==========================================
// FORMAT TIME
// ==========================================

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


function App() {

  // ==========================================
  // WEATHER
  // ==========================================

  const [locations, setLocations] =
    useState([]);

  const [
    selectedLocation,
    setSelectedLocation,
  ] = useState("Ahmedabad");

  const [weather, setWeather] =
    useState(null);

  const [status, setStatus] =
    useState("loading");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");


  // ==========================================
  // THEME
  // ==========================================

  const [theme, setTheme] = useState(() => {

    const savedTheme =
      localStorage.getItem(
        "mausam-theme"
      );

    if (
      savedTheme === "light" ||
      savedTheme === "dark"
    ) {
      return savedTheme;
    }

    return "light";
  });


  useEffect(() => {

    document.documentElement.setAttribute(
      "data-theme",
      theme
    );

    localStorage.setItem(
      "mausam-theme",
      theme
    );

  }, [theme]);


  // ==========================================
  // PROFILE + SINGLE ACTIVITY
  // ==========================================

  const [profiles, setProfiles] =
    useState([]);

  const [
    selectedProfile,
    setSelectedProfile,
  ] = useState(null);

  const [
    activityTypes,
    setActivityTypes,
  ] = useState([]);

  const [activities, setActivities] =
    useState([]);


  // ==========================================
  // PLANNED DAY ACTIVITIES
  // ==========================================

  const [
    plannedActivities,
    setPlannedActivities,
  ] = useState([]);


  // ==========================================
  // PLAN IMPROVEMENT TRACKING
  // ==========================================

  const [
    planImprovement,
    setPlanImprovement,
  ] = useState(null);


  // ==========================================
  // WHAT CHANGED
  // ==========================================

  const [
    weatherChanges,
    setWeatherChanges,
  ] = useState(null);


  // ==========================================
  // DAY ANALYSIS
  // ==========================================

  const [
    dayPlanResult,
    setDayPlanResult,
  ] = useState(null);

  const [
    dayPlanLoading,
    setDayPlanLoading,
  ] = useState(false);

  const [
    dayPlanError,
    setDayPlanError,
  ] = useState("");


  // ==========================================
  // WARNING INTELLIGENCE
  // ==========================================

  const [
    warningImpact,
    setWarningImpact,
  ] = useState(null);


  // ==========================================
  // INITIAL DATA
  // ==========================================

  useEffect(() => {

    fetchSupportedLocations()
      .then(setLocations)
      .catch(() => {
        setLocations([
          "Ahmedabad",
        ]);
      });


    fetchProfiles()
      .then((data) => {

        setProfiles(data);

        if (data.length > 0) {

          setSelectedProfile(
            data[0].key
          );

        }

      })
      .catch((error) => {

        console.error(
          "Could not load profiles:",
          error
        );

      });


    fetchActivityTypes()
      .then(setActivityTypes)
      .catch((error) => {

        console.error(
          "Could not load activity types:",
          error
        );

      });

  }, []);


  // ==========================================
  // LOAD WEATHER
  // ==========================================

  useEffect(() => {

    let cancelled = false;

    setStatus("loading");
    setErrorMessage("");

    setWeatherChanges(null);

    setDayPlanResult(null);
    setWarningImpact(null);
    setDayPlanError("");

    setPlanImprovement(null);
    setActivities([]);


    fetchCurrentWeather(
      selectedLocation
    )
      .then((data) => {

        if (cancelled) {
          return;
        }

        setWeather(data);
        setStatus("ready");

      })

      .catch((error) => {

        if (cancelled) {
          return;
        }

        setErrorMessage(
          error.message
        );

        setStatus("error");

      });


    return () => {
      cancelled = true;
    };

  }, [selectedLocation]);


  // ==========================================
  // WHAT CHANGED
  // ==========================================

  useEffect(() => {

    if (!weather) {
      return;
    }

    let cancelled = false;


    fetchWeatherChanges(
      selectedLocation
    )
      .then((data) => {

        if (cancelled) {
          return;
        }

        setWeatherChanges(data);

      })

      .catch((error) => {

        console.error(
          "Could not load weather changes:",
          error
        );

        if (!cancelled) {
          setWeatherChanges(null);
        }

      });


    return () => {
      cancelled = true;
    };

  }, [weather, selectedLocation]);


  // ==========================================
  // SINGLE ACTIVITY CHECK
  // ==========================================

  async function handleAddActivity(
    activityType,
    hour
  ) {

    const id =
      activityIdCounter++;

    try {

      const result =
        await scoreActivity(
          activityType,
          selectedLocation,
          hour,
          selectedProfile
        );

      setActivities(
        (previous) => [
          {
            id,
            result,
          },
          ...previous,
        ]
      );

    } catch (error) {

      setActivities(
        (previous) => [
          {
            id,
            error: error.message,
          },
          ...previous,
        ]
      );

    }
  }


  function handleRemoveActivity(id) {

    setActivities(
      (previous) =>
        previous.filter(
          (entry) =>
            entry.id !== id
        )
    );

  }


  // ==========================================
  // PROFILE CHANGE
  // ==========================================

  function handleProfileChange(
    profileKey
  ) {

    setSelectedProfile(
      profileKey
    );

    // Clear Single Activity Check
    // results from previous profile
    setActivities([]);

    // Clear previous Day Planner
    // analysis
    setDayPlanResult(null);

    setWarningImpact(null);

    setPlanImprovement(null);

    setDayPlanError("");
  }


  // ==========================================
  // SMART DAY ANALYSIS
  // ==========================================

  async function handleEvaluateDayPlan(
    activitiesToEvaluate
  ) {

    if (
      !activitiesToEvaluate ||
      activitiesToEvaluate.length === 0
    ) {
      return null;
    }


    setDayPlanLoading(true);
    setDayPlanError("");

    setDayPlanResult(null);
    setWarningImpact(null);


    try {

      // Selected profile is sent to
      // the personalized backend.

      const result =
        await fetchPersonalizedDay(
          selectedLocation,
          activitiesToEvaluate,
          selectedProfile
        );


      // ======================================
      // DAY RESULT
      // ======================================

      const formattedDayResult = {

        ...result.planner,

        overall_status:
          result.overall_status,

        overall_level:
          result.overall_level,

        overall_icon:
          result.overall_icon,

        overall_summary:
          result.overall_summary,

        decision_counts:
          result.decision_counts,

        recommendations:
          result.recommendations,

        location:
          result.location,

        profile:
          result.profile,

      };


      setDayPlanResult(
        formattedDayResult
      );


      // ======================================
      // WARNING RESULT
      // ======================================

      setWarningImpact({

        ...result.warning_analysis,

        location:
          result.location,

        source:
          result.warning_source,

        is_demo_data:
          result.is_demo_data,

      });


      return result;

    } catch (error) {

      console.error(
        "Could not analyse personalized day:",
        error
      );

      setDayPlanError(
        error.message ||
          "Could not analyse your day."
      );

      return null;

    } finally {

      setDayPlanLoading(false);

    }
  }


  // ==========================================
  // APPLY SAFER TIME + RE-ANALYSE
  // ==========================================

  async function handleUseBetterWindow(
    activityType,
    oldHour,
    newHour
  ) {

    const parsedNewHour =
      Number(
        String(newHour).split(":")[0]
      );


    // ========================================
    // FIND ACTIVITY BEFORE CHANGING IT
    // ========================================

    const changedActivity =
      plannedActivities.find(
        (activity) => {

          const formattedHour =
            `${String(
              activity.hour
            ).padStart(
              2,
              "0"
            )}:00`;

          return (
            activity.activity_type ===
              activityType &&
            formattedHour === oldHour
          );
        }
      );


    if (!changedActivity) {
      return;
    }


    // ========================================
    // SAVE "BEFORE" STATE
    // ========================================

    setPlanImprovement(
      (previous) => {

        if (!previous) {

          return {

            before: {

              status:
                dayPlanResult
                  ?.overall_status,

              level:
                dayPlanResult
                  ?.overall_level,

              icon:
                dayPlanResult
                  ?.overall_icon,

              red:
                dayPlanResult
                  ?.decision_counts
                  ?.red ?? 0,

              orange:
                dayPlanResult
                  ?.decision_counts
                  ?.orange ?? 0,

              warningAffected:
                warningImpact
                  ?.affected_activity_count ??
                0,
            },

            changes: [
              {
                activity:
                  changedActivity
                    .activity_label,

                activityType:
                  activityType,

                from:
                  oldHour,

                to:
                  newHour,
              },
            ],
          };
        }


        return {

          ...previous,

          changes: [
            ...previous.changes,

            {
              activity:
                changedActivity
                  .activity_label,

              activityType:
                activityType,

              from:
                oldHour,

              to:
                newHour,
            },
          ],
        };

      }
    );


    // ========================================
    // UPDATE SCHEDULE
    // ========================================

    const updatedActivities =
      plannedActivities.map(
        (activity) => {

          const formattedHour =
            `${String(
              activity.hour
            ).padStart(
              2,
              "0"
            )}:00`;

          if (
            activity.activity_type ===
              activityType &&
            formattedHour === oldHour
          ) {

            return {
              ...activity,
              hour:
                parsedNewHour,
            };
          }

          return activity;

        }
      );


    setPlannedActivities(
      updatedActivities
    );


    // ========================================
    // RE-ANALYSE UPDATED DAY
    // ========================================

    const payload =
      updatedActivities.map(
        (activity) => ({

          activity_type:
            activity.activity_type,

          hour:
            activity.hour,

        })
      );


    await handleEvaluateDayPlan(
      payload
    );
  }


  // ==========================================
  // CLEAR OLD IMPROVEMENT WHEN USER
  // MANUALLY CHANGES THE PLAN
  // ==========================================

  function handleSetPlannedActivities(
    value
  ) {

    setPlanImprovement(null);

    setDayPlanResult(null);

    setWarningImpact(null);

    setDayPlanError("");

    setPlannedActivities(
      value
    );
  }


  // ==========================================
  // THEME TOGGLE
  // ==========================================

  function toggleTheme() {

    setTheme(
      (currentTheme) =>
        currentTheme === "light"
          ? "dark"
          : "light"
    );

  }


  // ==========================================
  // PROFILE SUGGESTIONS
  // ==========================================

  const activeProfile =
    profiles.find(
      (profile) =>
        profile.key ===
        selectedProfile
    );


  const suggestedKeys =
    activeProfile
      ?.suggested_activities ?? [];


  // ==========================================
  // PERSONALIZED HOMEPAGE SUMMARY
  // ==========================================

  const homepageRecommendation =
    dayPlanResult
      ?.recommendations
      ?.find(
        (item) =>
          item.final_level ===
          "RED"
      ) ??
    dayPlanResult
      ?.recommendations
      ?.find(
        (item) =>
          item.final_level ===
          "ORANGE"
      ) ??
    dayPlanResult
      ?.recommendations?.[0] ??
    null;


  // ==========================================
  // SCROLL NAVIGATION
  // ==========================================

  function scrollToSection(id) {

    const section =
      document.getElementById(
        id
      );

    if (section) {

      section.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

    }
  }


  function scrollToDayPlanner() {

    scrollToSection(
      "day-planner"
    );

  }


  // ==========================================
  // UI
  // ==========================================

  return (

    <div className="app">


      {/* ===================================
          DESKTOP HEADER + NAVIGATION
      =================================== */}

      <header className="app-header">

        <div className="app-header__top">


          {/* BRAND */}

          <button
            type="button"
            className="app-brand app-brand--button"
            onClick={() =>
              scrollToSection(
                "today"
              )
            }
          >

            <div className="app-brand__logo">
              ☀️
            </div>

            <div className="app-brand__text">

              <h1 className="app-brand__name">
                MAUSAM
              </h1>

              <p className="app-brand__tagline">
                Personal Weather Intelligence
              </p>

            </div>

          </button>


          {/* DESKTOP NAV */}

          <nav className="app-nav">

            <button
              type="button"
              onClick={() =>
                scrollToSection(
                  "today"
                )
              }
            >
              Today
            </button>

            <button
              type="button"
              onClick={() =>
                scrollToSection(
                  "weather"
                )
              }
            >
              Weather
            </button>

            <button
              type="button"
              onClick={() =>
                scrollToSection(
                  "profile"
                )
              }
            >
              Profile
            </button>

            <button
              type="button"
              onClick={() =>
                scrollToSection(
                  "my-day"
                )
              }
            >
              My Day
            </button>

          </nav>


          {/* HEADER ACTIONS */}

          <div className="app-header__actions">


            {/* THEME */}

            <button
              type="button"
              className="theme-toggle"
              onClick={
                toggleTheme
              }
              aria-label={
                theme === "light"
                  ? "Switch to dark mode"
                  : "Switch to light mode"
              }
              title={
                theme === "light"
                  ? "Dark mode"
                  : "Light mode"
              }
            >

              {theme === "light"
                ? "🌙"
                : "☀️"}

            </button>


            {/* LOCATION */}

            <div className="app-header__location">

              <span className="app-header__location-icon">
                📍
              </span>

              {locations.length >
                0 && (

                <LocationSelector
                  locations={
                    locations
                  }
                  selected={
                    selectedLocation
                  }
                  onChange={
                    setSelectedLocation
                  }
                />

              )}

            </div>

          </div>

        </div>

      </header>


      <DemoDataBadge />


      <main className="app-main">


        {/* ===================================
            PERSONALIZED HOMEPAGE INTRO
        =================================== */}

        <section
          id="today"
          className="personal-home"
        >

          <div className="personal-home__intro">

            <div>

              <div className="personal-home__eyebrow-row">

                <p className="personal-home__eyebrow">
                  YOUR WEATHER, MADE PERSONAL
                </p>

                <span className="personal-home__live">

                  <span></span>

                  {selectedLocation}

                </span>

              </div>


              <h1>
                Good weather information is useful.
                <br />
                Personal weather guidance is better.
              </h1>


              <p className="personal-home__description">
                Weather tells you what is happening.
                Mausam tells you what it means for
                your day.
              </p>

            </div>


            {activeProfile && (

              <div className="personal-home__profile">

                <span className="personal-home__profile-icon">
                  {activeProfile.icon}
                </span>

                <div>

                  <small>
                    PERSONALIZED FOR
                  </small>

                  <strong>
                    {activeProfile.label}
                  </strong>

                </div>

              </div>

            )}

          </div>


          {/* TODAY FOR YOU */}

          <div className="today-for-you">

            <div>

              <p className="section-label">
                TODAY FOR YOU
              </p>


              {!dayPlanResult && (

                <>
                  <h2>
                    Plan your day around the weather.
                  </h2>

                  <p>
                    Add today's activities and Mausam
                    will check weather suitability,
                    warnings and safer times using your
                    selected profile.
                  </p>
                </>

              )}


              {dayPlanResult && (

                <>

                  <h2>
                    {dayPlanResult.overall_icon}{" "}
                    {dayPlanResult.overall_status}
                  </h2>

                  <p>
                    {dayPlanResult.overall_summary}
                  </p>


                  {homepageRecommendation && (

                    <p className="today-for-you__highlight">

                      <strong>
                        {
                          homepageRecommendation
                            .activity_label
                        }
                      </strong>

                      {" · "}

                      {formatTime(
                        homepageRecommendation
                          .hour
                      )}

                      {" — "}

                      {
                        homepageRecommendation
                          .final_icon
                      }{" "}

                      {
                        homepageRecommendation
                          .final_status
                      }

                    </p>

                  )}

                </>

              )}

            </div>


            <button
              type="button"
              className="today-for-you__button"
              onClick={
                scrollToDayPlanner
              }
            >

              {dayPlanResult
                ? "View My Day"
                : "Plan My Day"}

              {" →"}

            </button>

          </div>

        </section>


        {/* WEATHER LOADING */}

        {status === "loading" && (

          <p className="app-status">
            Loading weather…
          </p>

        )}


        {/* WEATHER ERROR */}

        {status === "error" && (

          <p className="app-status app-status--error">

            Couldn't load weather:{" "}
            {errorMessage}.

            Is the backend running on
            http://localhost:8000?

          </p>

        )}


        {/* ===================================
            WEATHER
        =================================== */}

        {status === "ready" &&
          weather && (

            <section
              id="weather"
              className="app-dashboard-section app-section-anchor"
            >

              <div className="app-section-heading">

                <div>

                  <p className="section-label">
                    WEATHER NOW
                  </p>

                  <h2>
                    Your weather in{" "}
                    {selectedLocation}
                  </h2>

                </div>

                <span className="app-section-heading__icon">
                  ☀️
                </span>

              </div>


              <CurrentWeatherHero
                weather={weather}
              />


              <div className="weather-insight-grid">

                <SunriseSunsetCard
                  location={
                    selectedLocation
                  }
                />

                <UVIndexCard
                  location={
                    selectedLocation
                  }
                  profile={
                    selectedProfile
                  }
                  profiles={
                    profiles
                  }
                />

              </div>


              <TravelerPackingCard
                weather={weather}
                profile={
                  selectedProfile
                }
                location={
                  selectedLocation
                }
              />


              <EventComfortCard
                weather={weather}
                profile={
                  selectedProfile
                }
                location={
                  selectedLocation
                }
              />

            </section>

          )}


        {/* ===================================
            PROFILE
        =================================== */}

        <section
          id="profile"
          className="app-dashboard-section app-section-anchor"
        >

          <div className="app-section-heading">

            <div>

              <p className="section-label">
                PERSONALIZATION
              </p>

              <h2>
                Make Mausam yours
              </h2>

              <p>
                Choose the profile that best
                matches your day.
              </p>

            </div>

            <span className="app-section-heading__icon">
              👤
            </span>

          </div>


          <ProfileSelector
            profiles={profiles}
            selected={
              selectedProfile
            }
            onChange={
              handleProfileChange
            }
          />


          <ProfileDailyInsight
            profile={
              selectedProfile
            }
            profiles={
              profiles
            }
            weather={
              weather
            }
          />

        </section>


        {/* ===================================
            MY DAY
        =================================== */}

        {status === "ready" &&
          activityTypes.length >
            0 && (

            <section
              id="my-day"
              className="app-dashboard-section app-section-anchor"
            >

              <div className="app-section-heading">

                <div>

                  <p className="section-label">
                    YOUR DAY
                  </p>

                  <h2>
                    Plan around the weather
                  </h2>

                  <p>
                    Add your activities and let
                    Mausam check weather,
                    warnings and safer times.
                  </p>

                </div>

                <span className="app-section-heading__icon">
                  📅
                </span>

              </div>


              <div
                id="day-planner"
                className="day-planner-anchor"
              >

                <DayPlanner
                  activityTypes={
                    activityTypes
                  }
                  plannedActivities={
                    plannedActivities
                  }
                  setPlannedActivities={
                    handleSetPlannedActivities
                  }
                  onEvaluate={
                    handleEvaluateDayPlan
                  }
                  loading={
                    dayPlanLoading
                  }
                />

              </div>

            </section>

          )}


        {/* DAY ANALYSIS ERROR */}

        {dayPlanError && (

          <p className="app-status app-status--error">
            {dayPlanError}
          </p>

        )}


        {/* ===================================
            PLAN IMPROVEMENT
        =================================== */}

        {planImprovement &&
          dayPlanResult && (

            <section className="plan-improved">

              <div className="plan-improved__heading">

                <div className="plan-improved__icon">
                  ✓
                </div>

                <div>

                  <p className="section-label">
                    SMART RESCHEDULING
                  </p>

                  <h3>
                    Plan Improved
                  </h3>

                  <p>
                    Mausam adjusted your schedule
                    using safer weather windows.
                  </p>

                </div>

              </div>


              <div className="plan-improved__comparison">

                <div className="plan-improved__state">

                  <span>
                    BEFORE
                  </span>

                  <strong>
                    {
                      planImprovement
                        .before.icon
                    }{" "}
                    {
                      planImprovement
                        .before.status
                    }
                  </strong>

                  <small>

                    {
                      planImprovement
                        .before
                        .warningAffected
                    }{" "}

                    warning-affected{" "}

                    {
                      planImprovement
                        .before
                        .warningAffected ===
                      1
                        ? "activity"
                        : "activities"
                    }

                  </small>

                </div>


                <div className="plan-improved__arrow">
                  →
                </div>


                <div className="plan-improved__state">

                  <span>
                    NOW
                  </span>

                  <strong>
                    {
                      dayPlanResult
                        .overall_icon
                    }{" "}
                    {
                      dayPlanResult
                        .overall_status
                    }
                  </strong>

                  <small>

                    {
                      warningImpact
                        ?.affected_activity_count ??
                      0
                    }{" "}

                    warning-affected{" "}

                    {
                      (
                        warningImpact
                          ?.affected_activity_count ??
                        0
                      ) === 1
                        ? "activity"
                        : "activities"
                    }

                  </small>

                </div>

              </div>


              <div className="plan-improved__changes">

                <strong>

                  {
                    planImprovement
                      .changes.length
                  }{" "}

                  safer{" "}

                  {
                    planImprovement
                      .changes.length ===
                    1
                      ? "time"
                      : "times"
                  }{" "}

                  applied

                </strong>


                {planImprovement
                  .changes
                  .map(
                    (
                      change,
                      index
                    ) => (

                      <div
                        key={`${change.activityType}-${index}`}
                        className="plan-improved__change"
                      >

                        <span>
                          {
                            change.activity
                          }
                        </span>

                        <span>

                          {formatTime(
                            change.from
                          )}

                          {" → "}

                          {formatTime(
                            change.to
                          )}

                        </span>

                      </div>

                    )
                  )}

              </div>

            </section>

          )}


        {/* DAY RESULT */}

        {dayPlanResult && (

          <DayPlanResult
            data={
              dayPlanResult
            }
            onUseBetterWindow={
              handleUseBetterWindow
            }
            loading={
              dayPlanLoading
            }
          />

        )}


        {/* PERSONALIZED WARNINGS */}

        {warningImpact && (

          <WarningImpactCard
            result={
              warningImpact
            }
          />

        )}


        {/* SINGLE ACTIVITY CHECK */}

        {activityTypes.length >
          0 && (

          <ActivityForm
            activityTypes={
              activityTypes
            }
            suggestedKeys={
              suggestedKeys
            }
            onAdd={
              handleAddActivity
            }
          />

        )}


        {/* SINGLE ACTIVITY RESULTS */}

        {activities.length >
          0 && (

          <section className="activity-list">

            <p className="section-label">
              Your Activities
            </p>


            {activities.map(
              (entry) => {

                if (
                  entry.error
                ) {

                  return (

                    <p
                      key={
                        entry.id
                      }
                      className="app-status app-status--error"
                    >

                      {
                        entry.error
                      }

                    </p>

                  );

                }


                return (

                  <ActivityScoreCard
                    key={
                      entry.id
                    }
                    result={
                      entry.result
                    }
                    onRemove={() =>
                      handleRemoveActivity(
                        entry.id
                      )
                    }
                  />

                );

              }
            )}

          </section>

        )}


        {/* WHAT CHANGED */}

        {status === "ready" &&
          weatherChanges && (

            <WhatChangedCard
              data={
                weatherChanges
              }
            />

          )}

      </main>


      {/* ===================================
          MOBILE BOTTOM NAVIGATION
      =================================== */}

      <nav className="mobile-nav">

        <button
          type="button"
          onClick={() =>
            scrollToSection(
              "today"
            )
          }
        >

          <span>
            🏠
          </span>

          <small>
            Today
          </small>

        </button>


        <button
          type="button"
          onClick={() =>
            scrollToSection(
              "weather"
            )
          }
        >

          <span>
            ☀️
          </span>

          <small>
            Weather
          </small>

        </button>


        <button
          type="button"
          onClick={() =>
            scrollToSection(
              "my-day"
            )
          }
        >

          <span>
            📅
          </span>

          <small>
            My Day
          </small>

        </button>


        <button
          type="button"
          onClick={() =>
            scrollToSection(
              "profile"
            )
          }
        >

          <span>
            👤
          </span>

          <small>
            Profile
          </small>

        </button>

      </nav>


      {/* ===================================
          ASK MAUSAM
      =================================== */}

      <AskMausam
        location={
          selectedLocation
        }
        profile={
          selectedProfile
        }
        profiles={
          profiles
        }
        activityTypes={
          activityTypes
        }
        plannedActivities={
          plannedActivities
        }
        setPlannedActivities={
          handleSetPlannedActivities
        }
        onEvaluateDay={
          handleEvaluateDayPlan
        }
        onUseBetterWindow={
          handleUseBetterWindow
        }
      />

    </div>
  );
}


export default App;