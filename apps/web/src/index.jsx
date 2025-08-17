import { debugStates, render, useState } from "@harvest/core";

const Counter = ({ title = "Contador" }) => {
  const [count, setCount] = useState(0);

  console.log(`Renderizando ${title} con count=${count}`);

  return (
    <div style={{ border: "1px solid #ccc", padding: "10px", margin: "10px" }}>
      <h3>
        {title}: {count}
      </h3>
      <button
        onClick={() => {
          console.log(`${title} - Botón + clickeado`);
          setCount(count + 1);
        }}
      >
        + Incrementar
      </button>
      <button
        onClick={() => {
          console.log(`${title} - Botón - clickeado`);
          setCount(count - 1);
        }}
      >
        - Decrementar
      </button>
      <button
        onClick={() => {
          console.log(`${title} - Botón reset clickeado`);
          setCount(0);
        }}
      >
        Reset
      </button>
    </div>
  );
};

const App = () => {
  const [showSecondCounter, setShowSecondCounter] = useState(false);

  console.log("Renderizando App");

  return (
    <div>
      <h1>react-based harvest</h1>

      {/* El primer counter automáticamente tendrá instanceIndex = 0 */}
      <Counter title="Primer Contador" />

      <button
        onClick={() => {
          console.log("Toggle segundo contador");
          setShowSecondCounter(!showSecondCounter);
        }}
      >
        {showSecondCounter ? "Ocultar" : "Mostrar"} Segundo Contador
      </button>

      {/* El segundo counter automáticamente tendrá instanceIndex = 1 */}
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
        <button onClick={() => debugStates()}>Ver Estados en Consola</button>
      </div>
    </div>
  );
};

console.log("Iniciando aplicación...");
render(App, document.getElementById("root"));
