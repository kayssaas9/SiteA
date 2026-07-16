import "./ModeSelector.css";

const MODES = [
  {
    id: "outfit",
    icon: "👗",
    label: "Outfit Generator",
    desc: "Try on any style on yourself",
  },
  {
    id: "car",
    icon: "🚗",
    label: "Car Upgrader",
    desc: "Replace your car with a dream ride",
  },
];

export default function ModeSelector({ mode, onChange }) {
  return (
    <div className="mode-selector">
      {MODES.map((m) => (
        <button
          key={m.id}
          className={`mode-card ${mode === m.id ? "active" : ""}`}
          onClick={() => onChange(m.id)}
        >
          <span className="mode-icon">{m.icon}</span>
          <div>
            <div className="mode-label">{m.label}</div>
            <div className="mode-desc">{m.desc}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
