import "./SunriseSunsetCard.css";

function SunriseSunsetCard({ location }) {

  const sunData = {
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


  const data =
    sunData[location] || {
      sunrise: "6:20 AM",
      sunset: "6:30 PM",
    };


  return (
    <section className="sun-card">

      <div className="sun-card__header">

        <div>
          <p className="sun-card__eyebrow">
            DAYLIGHT
          </p>

          <h3>
            Sunrise & Sunset
          </h3>
        </div>

        <span className="sun-card__icon">
          🌅
        </span>

      </div>


      <div className="sun-card__times">

        <div className="sun-card__item">

          <span className="sun-card__emoji">
            🌄
          </span>

          <div>
            <small>
              SUNRISE
            </small>

            <strong>
              {data.sunrise}
            </strong>
          </div>

        </div>


        <div className="sun-card__divider" />


        <div className="sun-card__item">

          <span className="sun-card__emoji">
            🌇
          </span>

          <div>
            <small>
              SUNSET
            </small>

            <strong>
              {data.sunset}
            </strong>
          </div>

        </div>

      </div>


      <p className="sun-card__tip">
        💡 Useful for planning walks, exercise,
        travel and outdoor activities.
      </p>

    </section>
  );
}

export default SunriseSunsetCard;