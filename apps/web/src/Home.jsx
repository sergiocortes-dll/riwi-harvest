import { useState } from "@harvest/core";
import { Link } from "@harvest/router";

const Counter = ({ title = "Contador" }) => {
  const [count, setCount] = useState(0);

  return (
    <div style={{ border: "1px solid #ccc", padding: "10px", margin: "10px" }}>
      <h3>
        {title}: {count}
      </h3>
      <button onClick={() => setCount(count + 1)}>+ Incrementar</button>
      <button onClick={() => setCount(count - 1)}>- Decrementar</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
};

export const HomePage = () => {
  const [showSecondCounter, setShowSecondCounter] = useState(false);

  return (
    <div>
      <h1>react-based harvest</h1>

      <nav>
        <Link to="/">Home</Link> |<Link to="/about">About</Link>
      </nav>

      <Counter title="Primer Contador" />

      <button onClick={() => setShowSecondCounter(!showSecondCounter)}>
        {showSecondCounter ? "Ocultar" : "Mostrar"} Segundo Contador
      </button>

      {showSecondCounter && <Counter title="Segundo Contador" />}

      <div
        style={{
          marginTop: "20px",
          padding: "10px",
          backgroundColor: "#f0f0f0",
        }}
      >
        <h3>Debug Info:</h3>
        <p>Segundo contador visible: {showSecondCounter ? "Sí" : "No"}</p>
      </div>
    </div>
  );
};
