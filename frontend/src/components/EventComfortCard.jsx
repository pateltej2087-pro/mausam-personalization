import "./EventComfortCard.css";

function EventComfortCard({
  weather,
  profile,
  location,
}) {
  // Only for Event Planner
  if (profile !== "event_planner") {
    return null;
  }

  if (!weather) {
    return null;
  }

  const temperature =
    weather.temperature_c ?? 30;

  const humidity =
    weather.humidity_percent ??
    weather.humidity ??
    50;

  const wind =
    weather.wind_kmh ?? 10;

  const rain =
    weather.rain_probability ?? 0;


  // Start with perfect comfort
  let score = 100;

  const factors = [];


  // Temperature
  if (temperature >= 35) {
    score -= 25;

    factors.push({
      icon: "🌡️",
      text: "High temperature may reduce guest comfort.",
    });
  } else if (temperature >= 30) {
    score -= 10;

    factors.push({
      icon: "🌡️",
      text: "Warm conditions may affect afternoon comfort.",
    });
  } else {
    factors.push({
      icon: "🌤️",
      text: "Temperature is comfortable for an outdoor event.",
    });
  }


  // Rain
  if (rain >= 60) {
    score -= 30;

    factors.push({
      icon: "🌧️",
      text: "High rain chance could disrupt an outdoor event.",
    });
  } else if (rain >= 30) {
    score -= 15;

    factors.push({
      icon: "☂️",
      text: "Keep a rain backup plan ready.",
    });
  }


  // Wind
  if (wind >= 30) {
    score -= 20;

    factors.push({
      icon: "💨",
      text: "Strong wind may affect decorations, tents or outdoor setups.",
    });
  } else {
    factors.push({
      icon: "🍃",
      text: "Wind conditions are manageable for most event setups.",
    });
  }


  // Humidity
  if (humidity >= 75) {
    score -= 15;

    factors.push({
      icon: "💧",
      text: "High humidity may reduce guest comfort.",
    });
  }


  score = Math.max(
    0,
    Math.min(100, score)
  );


  let level = "COMFORTABLE";
  let icon = "🟢";

  if (score < 50) {
    level = "POOR";
    icon = "🔴";
  } else if (score < 70) {
    level = "USE CAUTION";
    icon = "🟠";
  } else if (score < 85) {
    level = "FAIR";
    icon = "🟡";
  }


  return (
    <section className="event-comfort">

      <div className="event-comfort__header">

        <div>

          <p className="event-comfort__eyebrow">
            EVENT PLANNER INSIGHT
          </p>

          <h3>
            Outdoor Event Comfort
          </h3>

          <p>
            Current conditions in{" "}
            <strong>
              {location}
            </strong>
          </p>

        </div>

        <span className="event-comfort__header-icon">
          🎪
        </span>

      </div>


      <div className="event-comfort__score">

        <div className="event-comfort__number">
          {score}
        </div>

        <div>

          <small>
            COMFORT INDEX
          </small>

          <strong>
            {icon} {level}
          </strong>

          <p>
            Based on temperature,
            humidity, rain and wind.
          </p>

        </div>

      </div>


      <div className="event-comfort__factors">

        <small>
          WHAT THIS MEANS FOR YOUR EVENT
        </small>

        {factors.map(
          (factor, index) => (

            <div
              key={index}
              className="event-comfort__factor"
            >

              <span>
                {factor.icon}
              </span>

              <p>
                {factor.text}
              </p>

            </div>

          )
        )}

      </div>


      <div className="event-comfort__tip">
        ✨ Consider weather warnings separately
        before making final outdoor event decisions.
      </div>

    </section>
  );
}

export default EventComfortCard;