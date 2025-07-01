import React from "react";
import "../index.css";

const Landing: React.FC = () => {
  return (
    <div>
      <header className="header">
        <nav className="nav">
          <div className="logo">Neighborly</div>
          <div className="nav-links">
            <a href="/login">Login</a>
            <a href="/register">Register</a>
          </div>
        </nav>
      </header>
      <main className="main">
        <div className="slider">
          <img
            src="https://static.vecteezy.com/ti/gratis-vektor/p1/701690-abstrakter-polygonaler-banner-hintergrund-kostenlos-vektor.jpg"
            alt="das Banner Bild"
          />
          <div className="slider-text">
            <div className="slider-text-left">
              <h1>Willkommen auf Neighborly</h1>
              <h2>Ihre Nachbarschaft neu entdecken</h2>
            </div>
          </div>
        </div>
      </main>
      <footer className="footer"></footer>
    </div>
  );
};

export default Landing;
