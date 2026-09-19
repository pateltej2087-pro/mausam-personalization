import { useState } from "react";
import { scoreActivity } from "../services/api";
import "./AskMausam.css";


// ==========================================
// FORMAT TIME
// ==========================================

function formatTime(hour) {
  if (hour === null || hour === undefined) {
    return "";
  }

  const number = Number(
    String(hour).split(":")[0]
  );

  if (Number.isNaN(number)) {
    return hour;
  }

  const period =
    number >= 12 ? "PM" : "AM";

  const displayHour =
    number % 12 || 12;

  return `${displayHour}:00 ${period}`;
}


// ==========================================
// SUNRISE / SUNSET DEMO DATA
// Keep same as SunriseSunsetCard
// ==========================================

const SUN_DATA = {
  Ahmedabad: {
    sunrise: "6:28 AM",
    sunset: "6:39 PM",
  },

  Mumbai: {
    sunrise: "6:26 AM",
    sunset: "6:37 PM",
  },

  Delhi: {
    sunrise: "6:08 AM",
    sunset: "6:20 PM",
  },

  Bengaluru: {
    sunrise: "6:08 AM",
    sunset: "6:15 PM",
  },

  Chennai: {
    sunrise: "5:59 AM",
    sunset: "6:07 PM",
  },
};

// ==========================================
// UV INDEX DEMO DATA
// Keep same as UVIndexCard
// ==========================================

const UV_DATA = {
  Ahmedabad: 7,
  Mumbai: 6,
  Delhi: 7,
  Bengaluru: 5,
  Chennai: 8,
};


function getUVInfo(value) {
  if (value <= 2) {
    return {
      level: "LOW",
      advice:
        "UV exposure is low. Normal outdoor activity is generally comfortable.",
    };
  }

  if (value <= 5) {
    return {
      level: "MODERATE",
      advice:
        "Some sun protection is recommended during longer outdoor activity.",
    };
  }

  if (value <= 7) {
    return {
      level: "HIGH",
      advice:
        "Sun protection is recommended, especially during stronger midday sun.",
    };
  }

  if (value <= 10) {
    return {
      level: "VERY HIGH",
      advice:
        "Consider reducing prolonged exposure to strong midday sun.",
    };
  }

  return {
    level: "EXTREME",
    advice:
      "Extra sun protection is recommended and prolonged exposure should be limited.",
  };
}


function isUVQuestion(text) {
  const lower =
    text.toLowerCase();

  return (
    lower.includes("uv") ||
    lower.includes("ultraviolet")
  );
}


// ==========================================
// SUN QUESTION DETECTION
// ==========================================

function getSunQuestionType(text) {
  const lower =
    text.toLowerCase();

  if (
    lower.includes("sunrise") ||
    lower.includes("sun rise")
  ) {
    return "sunrise";
  }

  if (
    lower.includes("sunset") ||
    lower.includes("sun set")
  ) {
    return "sunset";
  }

  return null;
}


// ==========================================
// FIND TIME FROM QUESTION
// ==========================================

function findTime(text) {
  const lowerText =
    text.toLowerCase();

  const timeMatch =
    lowerText.match(
      /(\d{1,2})(?::(\d{2}))?\s*(am|pm)/
    );

  if (!timeMatch) {
    return null;
  }

  let hour =
    Number(timeMatch[1]);

  const period =
    timeMatch[3];

  if (
    period === "pm" &&
    hour !== 12
  ) {
    hour += 12;
  }

  if (
    period === "am" &&
    hour === 12
  ) {
    hour = 0;
  }

  return hour;
}


// ==========================================
// UNDERSTAND QUESTION
// ==========================================

function understandQuestion(
  text,
  activityTypes
) {
  const lowerText =
    text.toLowerCase();

  let activity = null;


  // Check actual activity names and keys
  for (const item of activityTypes) {

    const label =
      item.label?.toLowerCase() || "";

    const key =
      item.key
        ?.replaceAll("_", " ")
        .toLowerCase() || "";

    if (
      lowerText.includes(label) ||
      lowerText.includes(key)
    ) {
      activity = item;
      break;
    }
  }


  // Natural language aliases
  if (!activity) {

    const aliases = {
      walk: "walking",
      walking: "walking",

      cricket: "cricket",

      college:
        "college_commute",

      commute:
        "college_commute",

      event:
        "outdoor_event",

      cycling:
        "cycling",

      cycle:
        "cycling",

      running:
        "running",

      run:
        "running",
    };


    for (
      const [word, key]
      of Object.entries(aliases)
    ) {

      if (
        lowerText.includes(word)
      ) {

        activity =
          activityTypes.find(
            (item) =>
              item.key === key
          );

        if (activity) {
          break;
        }
      }
    }
  }


  return {
    activity,
    hour:
      findTime(text),
  };
}


// ==========================================
// WHAT-IF DETECTION
// ==========================================

function isWhatIfQuestion(text) {
  const lower =
    text.toLowerCase();

  return (
    lower.includes("what if") ||
    lower.includes("instead") ||
    lower.includes("how about")
  );
}


// ==========================================
// GET FINAL DECISION
// ==========================================

function getDecision(result) {
  return (
    result?.final_decision?.status ||
    result?.label ||
    ""
  );
}


// ==========================================
// PROFILE PERSONALIZATION MESSAGE
// ==========================================

function getProfileInsight(
  profileKey,
  profileLabel
) {

  const insights = {

    student:
      "rain, temperature and daily outdoor comfort are considered for your student routine.",

    commuter:
      "rain, visibility and travel conditions are given extra importance for your commute.",

    fitness:
      "air quality and temperature are given extra importance for outdoor exercise.",

    traveller:
      "weather comfort, rain and outdoor conditions are considered for your travel plans.",

    farmer_gardener:
      "rain, temperature and outdoor working conditions are important for your farming or gardening activities.",

    parent:
      "weather comfort and safer outdoor conditions are considered more carefully for family activities.",

    health_conscious:
      "air quality, temperature and weather exposure are given extra importance for your health.",

    event_planner:
      "rain, wind and outdoor comfort are especially important for event planning.",

    beach_coastal:
      "wind, rain and outdoor coastal comfort are given extra importance.",
  };


  const message =
    insights[profileKey];


  if (!message) {
    return null;
  }


  return {
    label:
      profileLabel ||
      "your selected profile",

    message,
  };
}


// ==========================================
// ASK MAUSAM
// ==========================================

function AskMausam({
  location,
  profile,
  profiles,
  activityTypes,
  plannedActivities = [],
  setPlannedActivities,
  onEvaluateDay,
  onUseBetterWindow,
}) {

  const [open, setOpen] =
    useState(false);

  const [input, setInput] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [
    lastAnalysis,
    setLastAnalysis,
  ] = useState(null);


  const [
    messages,
    setMessages,
  ] = useState([
    {
      id: 1,
      type: "bot",
      text:
        "Hi! I'm your personal weather copilot. Ask me how today's weather may affect your activities and plans.",
    },
  ]);


  // ========================================
  // ACTIVE PROFILE
  // ========================================

  const activeProfile =
    profiles.find(
      (item) =>
        item.key === profile
    );


  const profileInsight =
    getProfileInsight(
      profile,
      activeProfile?.label
    );


  // ========================================
  // QUICK QUESTIONS
  // ========================================

  const quickQuestions = [
    "Can I go for a walk at 8 PM?",
    "When should I go for a walk?",
    "Can I play cricket at 5 PM?",
    "What time is sunset today?",
  ];


  // ==========================================
  // SUNRISE / SUNSET ANSWER
  // ==========================================

  function answerSunQuestion(
    type
  ) {

    const data =
      SUN_DATA[location] || {
        sunrise: "6:20 AM",
        sunset: "6:30 PM",
      };


    const time =
      type === "sunrise"
        ? data.sunrise
        : data.sunset;


    setMessages(
      (previous) => [
        ...previous,
        {
          id:
            Date.now() + 20,

          type:
            "sun-info",

          sunType:
            type,

          time,

          location,
        },
      ]
    );
  }

  // ==========================================
// UV QUESTION
// ==========================================

function answerUVQuestion() {
  const uvIndex =
    UV_DATA[location] ?? 6;

  const uv =
    getUVInfo(uvIndex);

  setMessages((previous) => [
    ...previous,
    {
      id: Date.now() + 30,
      type: "uv-info",
      uvIndex,
      level: uv.level,
      advice: uv.advice,
      location,
    },
  ]);
}


  // ==========================================
  // NORMAL ACTIVITY ANALYSIS
  // ==========================================

  async function analyseActivity(
    activity,
    hour
  ) {

    setLoading(true);

    try {

      const result =
        await scoreActivity(
          activity.key,
          location,
          hour,
          profile
        );


      setLastAnalysis({
        activity,
        hour,
        result,
      });


      setMessages(
        (previous) => [
          ...previous,
          {
            id:
              Date.now() + 1,

            type:
              "result",

            result,
          },
        ]
      );

    } catch (error) {

      setMessages(
        (previous) => [
          ...previous,
          {
            id:
              Date.now() + 2,

            type:
              "bot",

            text:
              error.message ||
              "I couldn't analyse that activity.",
          },
        ]
      );

    } finally {

      setLoading(false);

    }
  }


  // ==========================================
  // FIND BEST TIME
  // ==========================================

  async function findBestTimeForActivity(
    activity
  ) {

    setLoading(true);

    try {

      const hoursToCheck = [
        6,
        8,
        10,
        12,
        14,
        16,
        18,
        20,
        22,
      ];


      const results =
        await Promise.all(

          hoursToCheck.map(
            (hour) =>
              scoreActivity(
                activity.key,
                location,
                hour,
                profile
              )
          )

        );


      // Prefer NONE or LOW warning impact
      const safeResults =
        results.filter(
          (result) => {

            const impact =
              result.warning?.impact ||
              "NONE";

            return (
              impact === "NONE" ||
              impact === "LOW"
            );
          }
        );


      const candidates =
        safeResults.length > 0
          ? safeResults
          : results;


      const sorted =
        [...candidates].sort(
          (a, b) =>
            b.score - a.score
        );


      const best =
        sorted[0];


      const alternatives =
        sorted.slice(1, 3);


      setLastAnalysis({

        activity,

        hour:
          Number(
            String(
              best.hour
            ).split(":")[0]
          ),

        result:
          best,
      });


      setMessages(
        (previous) => [
          ...previous,
          {
            id:
              Date.now() + 3,

            type:
              "best-time",

            activity,

            best,

            alternatives,
          },
        ]
      );

    } catch (error) {

      setMessages(
        (previous) => [
          ...previous,
          {
            id:
              Date.now() + 4,

            type:
              "bot",

            text:
              error.message ||
              "I couldn't find the best time for that activity.",
          },
        ]
      );

    } finally {

      setLoading(false);

    }
  }


  // ==========================================
  // WHAT-IF ANALYSIS
  // ==========================================

  async function analyseWhatIf(
    newHour,
    newActivity = null
  ) {

    if (
      !lastAnalysis &&
      !newActivity
    ) {

      setMessages(
        (previous) => [
          ...previous,
          {
            id:
              Date.now() + 5,

            type:
              "bot",

            text:
              'First ask me about an activity, for example "Can I play cricket at 5 PM?" Then ask "What if I play at 6 PM instead?"',
          },
        ]
      );

      return;
    }


    if (newHour === null) {

      setMessages(
        (previous) => [
          ...previous,
          {
            id:
              Date.now() + 6,

            type:
              "bot",

            text:
              'Tell me the alternative time. For example: "What if I do it at 6 PM instead?"',
          },
        ]
      );

      return;
    }


    const activity =
      newActivity ||
      lastAnalysis.activity;


    setLoading(true);


    try {

      const newResult =
        await scoreActivity(
          activity.key,
          location,
          newHour,
          profile
        );


      let previousResult =
        lastAnalysis.result;

      let previousHour =
        lastAnalysis.hour;


      // If user changes activity
      if (
        newActivity &&
        lastAnalysis &&
        newActivity.key !==
          lastAnalysis.activity.key
      ) {

        previousResult =
          await scoreActivity(
            newActivity.key,
            location,
            lastAnalysis.hour,
            profile
          );
      }


      const comparison = {
        activity,
        previousHour,
        previousResult,
        newHour,
        newResult,
      };


      setMessages(
        (previous) => [
          ...previous,
          {
            id:
              Date.now() + 7,

            type:
              "comparison",

            comparison,
          },
        ]
      );


      setLastAnalysis({
        activity,
        hour: newHour,
        result: newResult,
      });

    } catch (error) {

      setMessages(
        (previous) => [
          ...previous,
          {
            id:
              Date.now() + 8,

            type:
              "bot",

            text:
              error.message ||
              "I couldn't compare that time.",
          },
        ]
      );

    } finally {

      setLoading(false);

    }
  }


  // ==========================================
  // APPLY TIME TO DAY PLAN
  // ==========================================

  async function applyTimeToPlan(
    activity,
    oldHour,
    newHour
  ) {

    const oldHourNumber =
      Number(
        String(
          oldHour
        ).split(":")[0]
      );


    const newHourNumber =
      Number(
        String(
          newHour
        ).split(":")[0]
      );


    const existingActivity =
      plannedActivities.find(
        (item) =>
          item.activity_type ===
            activity.key &&

          Number(
            String(
              item.hour
            ).split(":")[0]
          ) === oldHourNumber
      );


    // ========================================
    // EXISTING ACTIVITY
    // ========================================

    if (
      existingActivity &&
      onUseBetterWindow
    ) {

      const formattedOldHour =
        `${String(
          oldHourNumber
        ).padStart(
          2,
          "0"
        )}:00`;


      const formattedNewHour =
        `${String(
          newHourNumber
        ).padStart(
          2,
          "0"
        )}:00`;


      await onUseBetterWindow(
        activity.key,
        formattedOldHour,
        formattedNewHour
      );


      setMessages(
        (previous) => [
          ...previous,
          {
            id:
              Date.now() + 9,

            type:
              "bot",

            text:
              `${activity.label} was moved from ${formatTime(
                oldHourNumber
              )} to ${formatTime(
                newHourNumber
              )}. Your day has been re-analysed.`,
          },
        ]
      );

      return;
    }


    // ========================================
    // NEW ACTIVITY
    // ========================================

    const newActivity = {

      activity_type:
        activity.key,

      activity_label:
        activity.label,

      hour:
        newHourNumber,
    };


    const updatedPlan = [
      ...plannedActivities,
      newActivity,
    ];


    if (
      setPlannedActivities
    ) {

      setPlannedActivities(
        updatedPlan
      );

    }


    const payload =
      updatedPlan.map(
        (item) => ({

          activity_type:
            item.activity_type,

          hour:
            Number(
              String(
                item.hour
              ).split(":")[0]
            ),

        })
      );


    if (onEvaluateDay) {

      await onEvaluateDay(
        payload
      );

    }


    setMessages(
      (previous) => [
        ...previous,
        {
          id:
            Date.now() + 10,

          type:
            "bot",

          text:
            `${activity.label} at ${formatTime(
              newHourNumber
            )} was added to your day and analysed.`,
        },
      ]
    );
  }


  // ==========================================
  // HANDLE QUESTION
  // ==========================================

  async function handleQuestion(
    question
  ) {

    const cleanQuestion =
      question.trim();


    if (!cleanQuestion) {
      return;
    }


    // Add user's message
    setMessages(
      (previous) => [
        ...previous,
        {
          id:
            Date.now(),

          type:
            "user",

          text:
            cleanQuestion,
        },
      ]
    );


    setInput("");


    // ========================================
    // SUNRISE / SUNSET QUESTION
    // ========================================

    const sunQuestion =
      getSunQuestionType(
        cleanQuestion
      );


    if (sunQuestion) {

      answerSunQuestion(
        sunQuestion
      );

      return;
    }

    // ========================================
// UV QUESTION
// ========================================

if (
  isUVQuestion(
    cleanQuestion
  )
) {
  answerUVQuestion();

  return;
}


    // ========================================
    // UNDERSTAND ACTIVITY QUESTION
    // ========================================

    const understood =
      understandQuestion(
        cleanQuestion,
        activityTypes
      );


    // ========================================
    // WHAT-IF
    // ========================================

    if (
      isWhatIfQuestion(
        cleanQuestion
      )
    ) {

      await analyseWhatIf(
        understood.hour,
        understood.activity
      );

      return;
    }


    // ========================================
    // ACTIVITY NOT FOUND
    // ========================================

    if (
      !understood.activity
    ) {

      setMessages(
        (previous) => [
          ...previous,
          {
            id:
              Date.now() + 11,

            type:
              "bot",

            text:
              'I couldn\'t identify the activity. Try "Can I play cricket at 5 PM?", "When should I go for a walk?" or "What time is sunset?"',
          },
        ]
      );

      return;
    }


    // ========================================
    // NO TIME = FIND BEST TIME
    // ========================================

    if (
      understood.hour === null
    ) {

      await findBestTimeForActivity(
        understood.activity
      );

      return;
    }


    // ========================================
    // NORMAL ACTIVITY + TIME
    // ========================================

    await analyseActivity(
      understood.activity,
      understood.hour
    );
  }


  // ==========================================
  // UI
  // ==========================================

  return (
    <>

      {/* =====================================
          FLOATING BUTTON
      ===================================== */}

      {!open && (

        <button
          type="button"
          className="ask-mausam-button"
          onClick={() =>
            setOpen(true)
          }
        >

          <span>
            ✨
          </span>

          <span>
            Ask Mausam
          </span>

        </button>

      )}


      {/* =====================================
          ASK MAUSAM PANEL
      ===================================== */}

      {open && (

        <section className="ask-mausam">


          {/* HEADER */}

          <div className="ask-mausam__header">

            <div>

              <strong>
                ✨ Ask Mausam
              </strong>

              <small>
                Personal Weather Copilot
              </small>

            </div>


            <button
              type="button"
              className="ask-mausam__close"
              onClick={() =>
                setOpen(false)
              }
            >
              ×
            </button>

          </div>


          {/* CONTEXT */}

          <div className="ask-mausam__context">

            <span>
              📍 {location}
            </span>


            {activeProfile && (

              <span>
                {activeProfile.icon}{" "}
                {activeProfile.label}
              </span>

            )}

          </div>


          {/* =================================
              MESSAGES
          ================================= */}

          <div className="ask-mausam__messages">


            {messages.map(
              (message) => {


                // ============================
                // USER MESSAGE
                // ============================

                if (
                  message.type ===
                  "user"
                ) {

                  return (

                    <div
                      key={message.id}
                      className="ask-mausam__user-message"
                    >

                      {message.text}

                    </div>

                  );
                }


                // ============================
                // BOT MESSAGE
                // ============================

                if (
                  message.type ===
                  "bot"
                ) {

                  return (

                    <div
                      key={message.id}
                      className="ask-mausam__bot-message"
                    >

                      {message.text}

                    </div>

                  );
                }


                // ============================
                // SUNRISE / SUNSET
                // ============================

                if (
                  message.type ===
                  "sun-info"
                ) {

                  const isSunrise =
                    message.sunType ===
                    "sunrise";


                  return (

                    <div
                      key={message.id}
                      className="ask-mausam__result"
                    >

                      <p className="section-label">

                        {isSunrise
                          ? "SUNRISE TODAY"
                          : "SUNSET TODAY"}

                      </p>


                      <strong className="ask-mausam__result-title">

                        {isSunrise
                          ? "🌄 Sunrise"
                          : "🌇 Sunset"}

                      </strong>


                      <div className="ask-mausam__best-time-main">

                        <small>
                          {message.location}
                        </small>

                        <strong>
                          {message.time}
                        </strong>

                      </div>


                      <p className="ask-mausam__reason">

                        {isSunrise
                          ? "Daylight begins around this time. It may be useful when planning early walks, travel or outdoor activities."
                          : "Daylight ends around this time. Consider it when planning evening travel or outdoor activities."}

                      </p>


                      <div className="ask-mausam__follow-up">

                        Prototype daylight data

                      </div>

                    </div>

                  );
                }

                // ============================
// UV INDEX
// ============================

if (
  message.type ===
  "uv-info"
) {
  return (
    <div
      key={message.id}
      className="ask-mausam__result"
    >

      <p className="section-label">
        UV INDEX TODAY
      </p>

      <strong className="ask-mausam__result-title">
        ☀️ UV Index
      </strong>


      <div className="ask-mausam__best-time-main">

        <small>
          {message.location}
        </small>

        <strong>
          {message.uvIndex}
        </strong>

        <span>
          {message.level}
        </span>

      </div>


      <p className="ask-mausam__reason">
        {message.advice}
      </p>


      {profileInsight && (

        <div className="ask-mausam__personalized">

          <small>
            👤 WHY THIS MATTERS FOR YOU
          </small>

          <p>
            As a{" "}
            <strong>
              {profileInsight.label}
            </strong>
            , your outdoor plans can be
            adjusted based on today's
            UV exposure.
          </p>

        </div>

      )}


      <div className="ask-mausam__follow-up">
        Prototype UV data
      </div>

    </div>
  );
}


                // ============================
                // NORMAL RESULT
                // ============================

                if (
                  message.type ===
                  "result"
                ) {

                  const result =
                    message.result;

                  const finalDecision =
                    result.final_decision;

                  const warning =
                    result.warning;

                  const safer =
                    result.safe_better_window;


                  return (

                    <div
                      key={message.id}
                      className="ask-mausam__result"
                    >


                      <strong className="ask-mausam__result-title">

                        {result.activity_label}

                        {" · "}

                        {formatTime(
                          result.hour
                        )}

                      </strong>


                      <div className="ask-mausam__result-row">

                        <span>
                          Weather Suitability
                        </span>

                        <strong>

                          {result.score}/100

                          {" · "}

                          {result.label}

                        </strong>

                      </div>


                      {/* WARNING */}

                      {warning &&
                        warning.impact !==
                          "NONE" && (

                          <div className="ask-mausam__warning">

                            <div>

                              ⚠️{" "}

                              <strong>
                                {warning.title}
                              </strong>

                            </div>

                            <span>

                              {warning.impact}
                              {" "}
                              impact

                            </span>

                          </div>

                        )}


                      {/* DECISION */}

                      {finalDecision && (

                        <div
                          className={
                            `ask-mausam__decision ask-mausam__decision--${
                              finalDecision.level
                                ?.toLowerCase()
                            }`
                          }
                        >

                          <small>
                            MY RECOMMENDATION
                          </small>

                          <strong>

                            {finalDecision.icon}

                            {" "}

                            {finalDecision.status}

                          </strong>

                        </div>

                      )}


                      {/* WHY */}

                      {finalDecision?.reason && (

                        <p className="ask-mausam__reason">

                          <strong>
                            Why?
                          </strong>

                          {" "}

                          {finalDecision.reason}

                        </p>

                      )}


                      {/* PROFILE PERSONALIZATION */}

                      {profileInsight && (

                        <div className="ask-mausam__personalized">

                          <small>
                            👤 WHY PERSONALIZED FOR YOU
                          </small>

                          <p>

                            As a{" "}

                            <strong>
                              {profileInsight.label}
                            </strong>

                            ,{" "}

                            {profileInsight.message}

                          </p>

                        </div>

                      )}


                      {/* ACTION */}

                      {finalDecision?.action && (

                        <p className="ask-mausam__action">

                          <strong>
                            What should I do?
                          </strong>

                          {" "}

                          {finalDecision.action}

                        </p>

                      )}


                      {/* SAFER TIME */}

                      {safer?.suggested_hour && (

                        <div className="ask-mausam__safer">

                          <small>
                            ✨ SAFER TIME FOUND
                          </small>

                          <strong>

                            {formatTime(
                              safer.suggested_hour
                            )}

                          </strong>

                          <span>

                            {safer.suggested_score}
                            /100

                            {" · "}

                            {safer.suggested_label}

                          </span>


                          {safer.reason && (

                            <p>
                              {safer.reason}
                            </p>

                          )}


                          <button
                            type="button"
                            className="ask-mausam__safer-button"
                            onClick={() =>
                              applyTimeToPlan(
                                {
                                  key:
                                    result.activity_type,

                                  label:
                                    result.activity_label,
                                },

                                result.hour,

                                safer.suggested_hour
                              )
                            }
                          >

                            ✓ Use safer{" "}

                            {formatTime(
                              safer.suggested_hour
                            )}

                          </button>

                        </div>

                      )}


                      <div className="ask-mausam__follow-up">

                        Try asking:{" "}

                        <strong>
                          What if I do it at another time?
                        </strong>

                      </div>

                    </div>

                  );
                }


                // ============================
                // BEST TIME RESULT
                // ============================

                if (
                  message.type ===
                  "best-time"
                ) {

                  const best =
                    message.best;

                  const activity =
                    message.activity;

                  const alternatives =
                    message.alternatives ||
                    [];

                  const warning =
                    best.warning;

                  const decision =
                    best.final_decision;


                  return (

                    <div
                      key={message.id}
                      className="ask-mausam__best-time"
                    >


                      <p className="section-label">
                        BEST TIME FOR YOU
                      </p>


                      <strong className="ask-mausam__best-time-title">

                        {activity.icon}{" "}
                        {activity.label}

                      </strong>


                      <div className="ask-mausam__best-time-main">

                        <small>
                          ✨ RECOMMENDED TIME
                        </small>

                        <strong>

                          {formatTime(
                            best.hour
                          )}

                        </strong>

                        <span>

                          {best.score}/100

                          {" · "}

                          {best.label}

                        </span>

                      </div>


                      {warning &&
                        warning.impact !==
                          "NONE" && (

                          <div className="ask-mausam__warning">

                            <div>

                              ⚠️{" "}

                              <strong>
                                {warning.title}
                              </strong>

                            </div>

                            <span>

                              {warning.impact}
                              {" "}
                              impact

                            </span>

                          </div>

                        )}


                      {decision?.reason && (

                        <p className="ask-mausam__reason">

                          <strong>
                            Why this time?
                          </strong>

                          {" "}

                          {decision.reason}

                        </p>

                      )}


                      {/* PROFILE PERSONALIZATION */}

                      {profileInsight && (

                        <div className="ask-mausam__personalized">

                          <small>
                            👤 WHY PERSONALIZED FOR YOU
                          </small>

                          <p>

                            As a{" "}

                            <strong>
                              {profileInsight.label}
                            </strong>

                            ,{" "}

                            {profileInsight.message}

                          </p>

                        </div>

                      )}


                      {/* ALTERNATIVES */}

                      {alternatives.length >
                        0 && (

                        <div className="ask-mausam__alternatives">

                          <small>
                            OTHER GOOD OPTIONS
                          </small>


                          {alternatives.map(
                            (result) => (

                              <div
                                key={
                                  result.hour
                                }
                                className="ask-mausam__alternative"
                              >

                                <strong>

                                  {formatTime(
                                    result.hour
                                  )}

                                </strong>

                                <span>

                                  {result.score}
                                  /100

                                  {" · "}

                                  {result.label}

                                </span>

                              </div>

                            )
                          )}

                        </div>

                      )}


                      <button
                        type="button"
                        className="ask-mausam__best-time-button"
                        onClick={() =>
                          applyTimeToPlan(
                            {
                              key:
                                best.activity_type,

                              label:
                                best.activity_label,
                            },

                            best.hour,
                            best.hour
                          )
                        }
                      >

                        + Add to My Day

                      </button>


                      <div className="ask-mausam__follow-up">

                        You can also ask:{" "}

                        <strong>
                          What if I do it at 6 PM?
                        </strong>

                      </div>

                    </div>

                  );
                }


                // ============================
                // WHAT-IF COMPARISON
                // ============================

                if (
                  message.type ===
                  "comparison"
                ) {

                  const data =
                    message.comparison;

                  const oldResult =
                    data.previousResult;

                  const newResult =
                    data.newResult;


                  const oldDecision =
                    getDecision(
                      oldResult
                    );


                  const newDecision =
                    getDecision(
                      newResult
                    );


                  const scoreDifference =
                    newResult.score -
                    oldResult.score;


                  const newWarning =
                    newResult.warning;


                  const safer =
                    newResult
                      .safe_better_window;


                  return (

                    <div
                      key={message.id}
                      className="ask-mausam__comparison"
                    >


                      <p className="section-label">
                        WHAT-IF COMPARISON
                      </p>


                      <strong className="ask-mausam__comparison-title">

                        {data.activity.label}

                      </strong>


                      <div className="ask-mausam__comparison-grid">


                        {/* CURRENT */}

                        <div>

                          <small>
                            CURRENT
                          </small>

                          <strong>

                            {formatTime(
                              data.previousHour
                            )}

                          </strong>

                          <span>

                            {oldResult.score}
                            /100

                          </span>

                          <span>
                            {oldDecision}
                          </span>

                        </div>


                        <div className="ask-mausam__comparison-arrow">
                          →
                        </div>


                        {/* WHAT IF */}

                        <div>

                          <small>
                            WHAT IF?
                          </small>

                          <strong>

                            {formatTime(
                              data.newHour
                            )}

                          </strong>

                          <span>

                            {newResult.score}
                            /100

                          </span>

                          <span>
                            {newDecision}
                          </span>

                        </div>

                      </div>


                      {/* SCORE CHANGE */}

                      <div className="ask-mausam__comparison-summary">


                        {scoreDifference >
                          0 && (

                          <>

                            Weather suitability improves by{" "}

                            <strong>
                              {scoreDifference} points
                            </strong>.

                          </>

                        )}


                        {scoreDifference <
                          0 && (

                          <>

                            Weather suitability becomes{" "}

                            <strong>

                              {Math.abs(
                                scoreDifference
                              )}{" "}
                              points lower

                            </strong>.

                          </>

                        )}


                        {scoreDifference ===
                          0 && (

                          <>

                            Weather suitability stays the same.

                          </>

                        )}

                      </div>


                      {/* WARNING */}

                      {newWarning &&
                        newWarning.impact !==
                          "NONE" && (

                          <div className="ask-mausam__warning">

                            <div>

                              ⚠️{" "}

                              <strong>
                                {newWarning.title}
                              </strong>

                            </div>

                            <span>

                              {newWarning.impact}
                              {" "}
                              impact still affects this time.

                            </span>

                          </div>

                        )}


                      {/* NEW FINAL DECISION */}

                      {newResult
                        .final_decision && (

                        <div
                          className={
                            `ask-mausam__decision ask-mausam__decision--${
                              newResult
                                .final_decision
                                .level
                                ?.toLowerCase()
                            }`
                          }
                        >

                          <small>

                            RESULT AT{" "}

                            {formatTime(
                              data.newHour
                            )}

                          </small>

                          <strong>

                            {
                              newResult
                                .final_decision
                                .icon
                            }

                            {" "}

                            {
                              newResult
                                .final_decision
                                .status
                            }

                          </strong>

                        </div>

                      )}


                      {/* BETTER OPTION */}

                      {safer?.suggested_hour && (

                        <div className="ask-mausam__safer">

                          <small>
                            ✨ BETTER OPTION
                          </small>

                          <strong>

                            {formatTime(
                              safer.suggested_hour
                            )}

                          </strong>

                          <span>

                            {safer.suggested_score}
                            /100

                            {" · "}

                            {safer.suggested_label}

                          </span>


                          {safer.reason && (

                            <p>
                              {safer.reason}
                            </p>

                          )}

                        </div>

                      )}


                      {/* ACTION BUTTONS */}

                      <div className="ask-mausam__actions">


                        {safer?.suggested_hour ? (

                          <>


                            {/* SAFER ACTION */}

                            <button
                              type="button"
                              onClick={() =>
                                applyTimeToPlan(
                                  data.activity,
                                  data.previousHour,
                                  safer.suggested_hour
                                )
                              }
                            >

                              ✓ Use safer{" "}

                              {formatTime(
                                safer.suggested_hour
                              )}

                            </button>


                            {/* USER WHAT-IF */}

                            <button
                              type="button"
                              className="ask-mausam__secondary-action"
                              onClick={() =>
                                applyTimeToPlan(
                                  data.activity,
                                  data.previousHour,
                                  data.newHour
                                )
                              }
                            >

                              Use{" "}

                              {formatTime(
                                data.newHour
                              )}{" "}
                              anyway

                            </button>


                          </>

                        ) : (

                          <button
                            type="button"
                            onClick={() =>
                              applyTimeToPlan(
                                data.activity,
                                data.previousHour,
                                data.newHour
                              )
                            }
                          >

                            ✓ Use{" "}

                            {formatTime(
                              data.newHour
                            )}

                          </button>

                        )}

                      </div>

                    </div>

                  );
                }


                return null;
              }
            )}


            {/* LOADING */}

            {loading && (

              <div className="ask-mausam__bot-message">

                Analysing weather,
                warnings and your profile...

              </div>

            )}


            {/* QUICK QUESTIONS */}

            {messages.length === 1 && (

              <div className="ask-mausam__quick">

                <small>
                  TRY ASKING
                </small>


                {quickQuestions.map(
                  (question) => (

                    <button
                      type="button"
                      key={question}
                      onClick={() =>
                        handleQuestion(
                          question
                        )
                      }
                    >

                      {question}

                    </button>

                  )
                )}

              </div>

            )}

          </div>


          {/* =================================
              INPUT
          ================================= */}

          <form
            className="ask-mausam__input"
            onSubmit={(event) => {

              event.preventDefault();

              handleQuestion(
                input
              );

            }}
          >

            <input
              type="text"
              value={input}
              disabled={loading}
              placeholder={
                lastAnalysis
                  ? "Try: What if I do it at 6 PM?"
                  : "Ask about weather or an activity..."
              }
              onChange={(event) =>
                setInput(
                  event.target.value
                )
              }
            />


            <button
              type="submit"
              disabled={loading}
            >
              ↑
            </button>

          </form>

        </section>

      )}

    </>
  );
}


export default AskMausam;