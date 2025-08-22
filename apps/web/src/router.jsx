import { debugStates, useState } from "@harvest/core";
import { Router } from "@harvest/router";
import Clanes from "./page/clanes";
import Home from "./page/Home";
import Layout from "./page/Layout";
import Sede from "./page/sede/Sede";
import SedeLayout from "./page/sede/SedeLayout";

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

export const TestApp = () => {
  const [showSecondCounter, setShowSecondCounter] = useState(false);

  console.log("Renderizando App");

  return (
    <div>
      <h1>react-based harvest</h1>
      <Counter title="Primer Contador" />
      <button
        onClick={() => {
          console.log("Toggle segundo contador");
          setShowSecondCounter(!showSecondCounter);
        }}
      >
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
        <button onClick={() => debugStates()}>Ver Estados en Consola</button>
      </div>
    </div>
  );
};

// RUTAS CON JSX - mucho más limpio
const routes = [
  {
    path: "/",
    element: Layout, // ✅ Función del componente
    children: [
      {
        path: "", // Ruta vacía para "/"
        element: Home, // ✅ JSX directo
      },
      {
        path: "clanes",
        element: Clanes,
      },
      {
        path: "desarrollo",
        element: () => <div>Desarrollo</div>,
      },
      {
        path: "hola", // Sin "/" - relativo al padre
        element: Home, // ✅ Función del componente
      },
      {
        path: "test", // Sin "/" - relativo al padre
        element: () => <div>Página de test</div>, // ✅ JSX directo
      },
      {
        path: "sede",
        element: SedeLayout,
        children: [
          {
            path: ":sede",
            element: <Sede />,
          },
        ],
      },
    ],
  },
];

const AppRouter = () => <Router routes={routes} />;

export default AppRouter;
