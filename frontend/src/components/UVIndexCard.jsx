import "./UVIndexCard.css";

function UVIndexCard({
  location,
  profile,
  profiles,
}) {

  // Demo UV values for prototype
  const uvData = {
    Ahmedabad: 7,
    Mumbai: 6,
    Delhi: 7,
    Bengaluru: 5,
    Chennai: 8,
  };


  const uvIndex =
    uvData[location] ?? 6;


  function getUVLevel(value) {
    if (value <= 2) {
      return {
        level: "LOW",
        advice:
          "Low UV exposure. Normal outdoor activity is generally comfortable.",
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
          "Protection is recommended, especially during stronger midday sun.",
      };
    }

    if (value <= 10) {
      return {
        level: "VERY HIGH",
        advice:
          "Reduce prolonged exposure to strong midday sun.",
      };
    }

    return {
      level: "EXTREME",
      advice:
        "Extra sun protection is recommended and prolonged exposure should be limited.",
    };
  }


  function getProfileAdvice(
    profileKey
  ) {
    const advice = {
      student:
        "Carry sun protection if you have classes, sports or travel outdoors.",

      commuter:
        "Consider sun exposure during your regular commute, especially around midday.",

      fitness:
        "Morning or evening may be more comfortable for longer outdoor exercise.",

      traveller:
        "Keep sun protection handy while sightseeing or spending long periods outdoors.",

      farmer_gardener:
        "For longer outdoor work, consider avoiding the strongest midday sun where practical.",

      parent:
        "Consider extra sun protection during longer family or children's outdoor activities.",

      health_conscious:
        "Limit unnecessary prolonged exposure during periods of stronger UV.",

      event_planner:
        "Shade and sun protection may improve comfort for daytime outdoor events.",

      beach_coastal:
        "Sun protection is especially useful for extended outdoor and beach activities.",
    };

    return (
      advice[profileKey] ||
      "Consider the UV level when planning longer outdoor activities."
    );
  }


  const uv =
    getUVLevel(uvIndex);


  const activeProfile =
    profiles.find(
      (item) =>
        item.key === profile
    );


  return (
    <section className="uv-card">

      <div className="uv-card__header">

        <div>
          <p className="uv-card__eyebrow">
            SUN EXPOSURE
          </p>

          <h3>
            UV Index
          </h3>
        </div>

        <span className="uv-card__icon">
          ☀️
        </span>

      </div>


      <div className="uv-card__main">

        <div className="uv-card__value">
          {uvIndex}
        </div>

        <div>

          <small>
            TODAY
          </small>

          <strong>
            {uv.level}
          </strong>

          <p>
            {uv.advice}
          </p>

        </div>

      </div>


      {activeProfile && (

        <div className="uv-card__personal">

          <small>
            👤 FOR YOU
          </small>

          <strong>
            {activeProfile.icon}{" "}
            {activeProfile.label}
          </strong>

          <p>
            {getProfileAdvice(
              profile
            )}
          </p>

        </div>

      )}


      <p className="uv-card__demo">
        Prototype UV data
      </p>

    </section>
  );
}

export default UVIndexCard;