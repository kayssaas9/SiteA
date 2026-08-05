import "./BrandLogo.css";

export default function BrandLogo({ className = "" }) {
  return (
    <span className={`brand-logo ${className}`.trim()} aria-label="Astracrea">
      <img src="/favicon.svg" alt="" className="brand-logo-mark" />
      <span className="brand-logo-name">Astracrea</span>
    </span>
  );
}