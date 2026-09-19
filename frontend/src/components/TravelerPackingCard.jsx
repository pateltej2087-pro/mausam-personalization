import "./TravelerPackingCard.css";

function TravelerPackingCard({
  weather,
  profile,
  location,
}) {

  // Show only for Traveller profile
  if (profile !== "traveller") {
    return null;
  }


  if (!weather) {
    return null;
  }


  const suggestions = [];


  // Temperature
  if (weather.temperature_c >= 30) {
    suggestions.push({
      icon: "💧",
      title: "Carry water",
      reason:
        "Warm conditions may make longer outdoor travel tiring.",
    });

    suggestions.push({
      icon: "🧴",
      title: "Pack sun protection",
      reason:
        "Sun protection can help during longer outdoor travel.",
    });
  }


  // Rain
  if (
    weather.rain_probability >= 30
  ) {
    suggestions.push({
      icon: "☂️",
      title: "Carry an umbrella",
      reason:
        `${weather.rain_probability}% chance of rain is expected.`,
    });
  }


  // Wind
  if (weather.wind_kmh >= 25) {
    suggestions.push({
      icon: "🧥",
      title: "Keep a light outer layer",
      reason:
        "Windy conditions may affect outdoor comfort.",
    });
  }


  // AQI
  if (weather.aqi >= 150) {
    suggestions.push({
      icon: "😷",
      title: "Consider air quality",
      reason:
        `AQI is ${weather.aqi}, so prolonged outdoor exposure may be less comfortable.`,
    });
  }


  // Visibility
  if (weather.visibility_km < 5) {
    suggestions.push({
      icon: "🚗",
      title: "Allow extra travel time",
      reason:
        "Reduced visibility may affect road travel.",
    });
  }


  // Fallback
  if (suggestions.length === 0) {
    suggestions.push({
      icon: "🎒",
      title: "Light travel pack",
      reason:
        "No major weather-related packing needs are indicated.",
    });
  }


  return (
    <section className="packing-card">

      <div className="packing-card__header">

        <div>

          <p className="packing-card__eyebrow">
            PERSONALIZED FOR TRAVEL
          </p>

          <h3>
            Your Weather Pack
          </h3>

          <p className="packing-card__subtitle">
            Suggested for your trip in{" "}
            <strong>
              {location}
            </strong>
          </p>

        </div>


        <span className="packing-card__icon">
          🧳
        </span>

      </div>


      <div className="packing-card__list">

        {suggestions.map(
          (item, index) => (

            <div
              key={index}
              className="packing-card__item"
            >

              <span className="packing-card__item-icon">
                {item.icon}
              </span>


              <div>

                <strong>
                  {item.title}
                </strong>

                <p>
                  {item.reason}
                </p>

              </div>

            </div>

          )
        )}

      </div>


      <div className="packing-card__footer">

        <span>
          ✨
        </span>

        Suggestions adapt to your
        selected location and weather.

      </div>

    </section>
  );
}

export default TravelerPackingCard;