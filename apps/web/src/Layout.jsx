import { Link, Outlet, updateOutlet } from "@harvest/router";

const MainLayout = () => {
  console.log("🎨 MainLayout rendering with Outlet pattern");

  return (
    <div>
      {/* Header/Navigation común para todas las páginas */}
      <header
        style={{
          padding: "1rem",
          backgroundColor: "#f0f0f0",
          borderBottom: "1px solid #ccc",
          marginBottom: "1rem",
        }}
      >
        <button onClick={updateOutlet}>Ejecutar algo</button>
        <nav>
          <Link to="/" style={{ marginRight: "1rem" }}>
            Home
          </Link>
          <Link to="/about" style={{ marginRight: "1rem" }}>
            About
          </Link>
          <Link to="/test">test</Link>
        </nav>
      </header>

      {/* Contenido principal de cada página usando Outlet */}
      <main style={{ padding: "1rem" }}>
        <Outlet />
      </main>

      {/* Footer común para todas las páginas */}
      <footer
        style={{
          padding: "1rem",
          backgroundColor: "#f0f0f0",
          borderTop: "1px solid #ccc",
          marginTop: "2rem",
          textAlign: "center",
        }}
      >
        <p>© 2025 Harvest App - Layout común usando Outlet pattern</p>
      </footer>
    </div>
  );
};

export default MainLayout;
