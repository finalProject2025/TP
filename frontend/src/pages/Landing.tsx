import React from "react";
import "../index.css";

const Landing: React.FC = () => {
  return (
    <div>
      <header className="header">
        <nav className="bg-white shadow-sm border-b border-gray-100 backdrop-blur-sm bg-opacity-95">
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
          <div className="slider-textl">
            <div className="slider-text-left">
              <h1>Willkommen auf Neighborly</h1>
              <h2>Ihre Nachbarschaft neu entdecken</h2>
            </div>
          </div>
                    <div className="slider-textr">
            <div className="slider-text-right">
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
