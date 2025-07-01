import React from "react";
import "../index.css";

const Landing: React.FC = () => {
  return (
    <div>
      <header className="header">
        <nav className="nav">
          <div className="logo">MyApp</div>
          <div className="nav-links">
            <a href="/login">Login</a>
            <a href="/register">Register</a>
          </div>
        </nav>
      </header>
      <main className="main">
        <h1>Landing Page</h1>
        <p>Welcome to the landing page!</p>
      </main>
      <footer className="footer"></footer>
    </div>
  );
};

export default Landing;
