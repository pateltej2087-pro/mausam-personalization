export default function LocationSelector({ locations, selected, onChange }) {
  return (
    <label className="location-selector">
      <span>Location</span>
      <select value={selected} onChange={(event) => onChange(event.target.value)}>
        {locations.map((city) => (
          <option key={city} value={city}>
            {city}
          </option>
        ))}
      </select>
    </label>
  );
}