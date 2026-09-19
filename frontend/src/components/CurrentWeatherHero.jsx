function greeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";

  return "Good Evening";
}


function getAQIStatus(aqi) {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive Groups";
  if (aqi <= 200) return "Poor";

  return "Very Poor";
}


export default function CurrentWeatherHero({
  weather,
}) {

  const observedAt =
    new Date(
      weather.observation_time
    ).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });


  return (
    <section className="hero">

      {/* TOP */}

      <div className="hero__top">

        <div>

          <p className="hero__eyebrow">
            {greeting()}
          </p>

          <h1 className="hero__location">
            {weather.location}
          </h1>

          <p className="hero__context">
            Here's what today's weather means
            for your day.
          </p>

        </div>


        <div className="hero__condition">

          <span className="hero__condition-icon">
            ☀️
          </span>

          <span>
            {weather.condition}
          </span>

        </div>

      </div>


      {/* TEMPERATURE */}

      <div className="hero__reading">

        <span className="hero__temp">
          {Math.round(
            weather.temperature_c
          )}°
        </span>


        <div className="hero__details">

          <span>
            FEELS LIKE
          </span>

          <strong>
            {Math.round(
              weather.feels_like_c
            )}°C
          </strong>

        </div>

      </div>


      {/* WEATHER STATS */}

      <dl className="hero__stats">

        <div>

          <dt>
            💧 Humidity
          </dt>

          <dd>
            {weather.humidity_percent}%
          </dd>

        </div>


        <div>

          <dt>
            🌧️ Rain chance
          </dt>

          <dd>
            {weather.rain_probability_percent}%
          </dd>

        </div>


        <div>

          <dt>
            💨 Wind
          </dt>

          <dd>
            {weather.wind_speed_kmph}
            <small> km/h</small>
          </dd>

        </div>


        <div>

          <dt>
            👁️ Visibility
          </dt>

          <dd>
            {weather.visibility_km}
            <small> km</small>
          </dd>

        </div>


        <div>

          <dt>
            🌫️ AQI
          </dt>

          <dd>
            {weather.aqi}
          </dd>

          <span className="hero__stat-note">
            {getAQIStatus(
              weather.aqi
            )}
          </span>

        </div>

      </dl>


      {/* FOOTER */}

      <div className="hero__footer">

        <span className="hero__updated-dot" />

        <p className="hero__updated">
          Updated {observedAt}
          {" · "}
          {weather.source}
        </p>

      </div>

    </section>
  );
}