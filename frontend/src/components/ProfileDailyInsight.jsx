import "./ProfileDailyInsight.css";

function ProfileDailyInsight({
  profile,
  profiles,
  weather,
}) {
  if (!profile || !weather) {
    return null;
  }

  const activeProfile =
    profiles.find(
      (item) => item.key === profile
    );

  if (!activeProfile) {
    return null;
  }


  const insights = {
    student: {
      icon: "🎓",
      title: "Student Day",
      message:
        "Check rain and heat before college travel, classes or outdoor activities.",
      focus:
        "Focus today: commute comfort and outdoor plans",
    },

    commuter: {
      icon: "🚗",
      title: "Commute Outlook",
      message:
        "Rain, visibility and weather warnings can affect your daily travel.",
      focus:
        "Focus today: travel conditions and timing",
    },

    fitness: {
      icon: "🏃",
      title: "Fitness Outlook",
      message:
        "Temperature, air quality and UV conditions can affect outdoor exercise.",
      focus:
        "Focus today: safer and more comfortable workout timing",
    },

    traveller: {
      icon: "🧳",
      title: "Travel Outlook",
      message:
        "Use today's weather, daylight and packing suggestions to prepare for your trip.",
      focus:
        "Focus today: packing, daylight and outdoor comfort",
    },

    farmer_gardener: {
      icon: "🌱",
      title: "Outdoor Work Outlook",
      message:
        "Temperature, rain and outdoor conditions can affect farming and gardening work.",
      focus:
        "Focus today: outdoor working conditions",
    },

    parent: {
      icon: "👨‍👩‍👧",
      title: "Family Weather",
      message:
        "Check heat, UV, rain and warnings before planning family outdoor activities.",
      focus:
        "Focus today: comfortable outdoor time for the family",
    },

    health_conscious: {
      icon: "❤️",
      title: "Health Weather",
      message:
        "Air quality, temperature and UV exposure are important factors for your day.",
      focus:
        "Focus today: exposure and outdoor comfort",
    },

    event_planner: {
      icon: "🎪",
      title: "Event Outlook",
      message:
        "Temperature, rain, wind, UV and weather warnings can affect outdoor events.",
      focus:
        "Focus today: guest comfort and weather risk",
    },

    beach_coastal: {
      icon: "🏖️",
      title: "Coastal Outlook",
      message:
        "Wind, rain, heat and UV conditions are important for outdoor coastal plans.",
      focus:
        "Focus today: outdoor and coastal comfort",
    },
  };


  const insight =
    insights[profile];

  if (!insight) {
    return null;
  }


  return (
    <section className="profile-daily">

      <div className="profile-daily__top">

        <div className="profile-daily__icon">
          {insight.icon}
        </div>

        <div>

          <p className="profile-daily__eyebrow">
            PERSONALIZED FOR YOU
          </p>

          <h3>
            {insight.title}
          </h3>

        </div>

      </div>


      <p className="profile-daily__message">
        {insight.message}
      </p>


      <div className="profile-daily__focus">

        <span>
          ✨
        </span>

        <div>

          <small>
            TODAY'S FOCUS
          </small>

          <strong>
            {insight.focus}
          </strong>

        </div>

      </div>


      <p className="profile-daily__profile">
        Active profile:{" "}
        <strong>
          {activeProfile.icon}{" "}
          {activeProfile.label}
        </strong>
      </p>

    </section>
  );
}

export default ProfileDailyInsight;