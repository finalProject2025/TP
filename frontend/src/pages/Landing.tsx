const Landing = () => {
  return (
    <div>
      <header style={{ display: "flex", justifyContent: "space-between", height: "200px", backgroundColor: "lightgray", width: "100%" }}>
        <nav>
          <a href="/login">Login</a>
          <a href="/register">Register</a>
        </nav>
      </header>
      <main>
        <h1>Landing Page</h1>
        <p>Welcome to the landing page!</p>
      </main>
      <footer></footer>
    </div>
  );
};

export default Landing;
