import "./BrandLogo.css";

export default function BrandLogo({ className = "", name = "Astracrea" }) {
  return (
    <span className={`brand-logo ${className}`.trim()} aria-label="Astracrea">
      <img src="/brand-logo.png?v=1" alt="" className="brand-logo-mark" />
      <span className="brand-logo-name">{name}</span>
    </span>
  );
}