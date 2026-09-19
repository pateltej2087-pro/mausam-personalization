export default function ProfileSelector({ profiles, selected, onChange }) {
  if (!profiles.length) return null;

  return (
    <section className="profile-selector">
      <p className="section-label">I am a...</p>
      <div className="profile-selector__chips">
        {profiles.map((profile) => (
          <button
            key={profile.key}
            type="button"
            className={`chip ${selected === profile.key ? "chip--active" : ""}`}
            onClick={() => onChange(profile.key)}
          >
            {profile.icon} {profile.label}
          </button>
        ))}
      </div>
    </section>
  );
}