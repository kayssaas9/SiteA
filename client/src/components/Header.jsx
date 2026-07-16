import "./Header.css";

export default function Header() {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="logo">
          <span className="logo-icon">🍌</span>
          <span className="logo-text">nano-banana</span>
        </div>
        <nav className="nav">
          <a href="#" className="nav-link">Gallery</a>
          <a href="#" className="nav-link">Pricing</a>
          <button className="nav-btn">Get Started</button>
        </nav>
      </div>
    </header>
  );
}
