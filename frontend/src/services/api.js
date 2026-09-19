const API_BASE_URL = "http://localhost:8000";

async function handleResponse(response, fallbackMessage) {
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.detail || fallbackMessage);
  }

  return response.json();
}


// --------------------------------------------------
// WEATHER
// --------------------------------------------------

export async function fetchCurrentWeather(location) {
  const response = await fetch(
    `${API_BASE_URL}/weather/current?location=${encodeURIComponent(location)}`
  );

  return handleResponse(
    response,
    "Failed to fetch weather data."
  );
}


export async function fetchSupportedLocations() {
  const response = await fetch(
    `${API_BASE_URL}/weather/locations`
  );

  return handleResponse(
    response,
    "Failed to fetch supported locations."
  );
}


// --------------------------------------------------
// PROFILES
// --------------------------------------------------

export async function fetchProfiles() {
  const response = await fetch(
    `${API_BASE_URL}/profiles`
  );

  return handleResponse(
    response,
    "Failed to fetch profiles."
  );
}


// --------------------------------------------------
// ACTIVITY TYPES
// --------------------------------------------------

export async function fetchActivityTypes() {
  const response = await fetch(
    `${API_BASE_URL}/activities/types`
  );

  return handleResponse(
    response,
    "Failed to fetch activity types."
  );
}


// --------------------------------------------------
// ACTIVITY SUITABILITY
// --------------------------------------------------

export async function scoreActivity(
  activityType,
  location,
  hour,
  profileKey
) {
  const response = await fetch(
    `${API_BASE_URL}/activities/score`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        activity_type: activityType,
        location: location,
        hour: Number(hour),
        profile_key: profileKey,
      }),
    }
  );

  return handleResponse(
    response,
    "Failed to score activity."
  );
}


// --------------------------------------------------
// WEATHER WARNINGS
// --------------------------------------------------

export async function fetchWarnings(location) {
  const response = await fetch(
    `${API_BASE_URL}/warnings?location=${encodeURIComponent(location)}`
  );

  return handleResponse(
    response,
    "Failed to fetch weather warnings."
  );
}


// --------------------------------------------------
// SMART DAY PLANNER
// --------------------------------------------------

export async function createDayPlan(
  location,
  activities
) {
  const response = await fetch(
    `${API_BASE_URL}/planner/day`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        location: location,

        activities: activities.map((activity) => ({
          activity_type: activity.activity_type,
          hour: Number(activity.hour),
        })),
      }),
    }
  );

  return handleResponse(
    response,
    "Failed to create smart day plan."
  );
}


// --------------------------------------------------
// WHAT CHANGED?
// --------------------------------------------------

export async function compareWeather(
  previous,
  current
) {
  const response = await fetch(
    `${API_BASE_URL}/changes/compare`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        previous,
        current,
      }),
    }
  );

  return handleResponse(
    response,
    "Failed to compare weather changes."
  );
}

export async function fetchWeatherChanges(
  location,
  activityType = null
) {
  const params = new URLSearchParams({
    location,
  });

  if (activityType) {
    params.append("activity_type", activityType);
  }

  const response = await fetch(
    `${API_BASE_URL}/changes?${params.toString()}`
  );

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));

    throw new Error(
      body.detail || "Failed to fetch weather changes."
    );
  }

  return response.json();
}

export async function evaluateDayPlan(location, activities) {
  const response = await fetch(`${API_BASE_URL}/planner/evaluate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      location,
      activities,
    }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));

    throw new Error(
      body.detail || "Failed to evaluate your day plan."
    );
  }

  return response.json();
}

export async function evaluateWarningImpact(location, activities) {
  const response = await fetch(
    `${API_BASE_URL}/warnings/impact/evaluate`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        location,
        activities,
      }),
    }
  );

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));

    throw new Error(
      body.detail || "Failed to evaluate weather warning impacts."
    );
  }

  return response.json();
}

export async function fetchPersonalizedDay(
  location,
  activities,
  profileKey
) {

  const response = await fetch(
    `${API_BASE_URL}/personalized/day`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        location,
        profile_key: profileKey,
        activities,
      }),
    }
  );


  if (!response.ok) {

    const body =
      await response
        .json()
        .catch(() => ({}));

    throw new Error(
      body.detail ||
        "Failed to analyse personalized day."
    );
  }


  return response.json();
}