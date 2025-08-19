import { Router } from "@harvest/router";
import { HomePage } from "./Home";
import MainLayout from "./Layout";

const AboutPage = () => {
  return (
    <div>
      <h1>About Page</h1>
      <p>Esta es la página about, también usando el layout principal.</p>
    </div>
  );
};

const NotFoundPage = () => {
  return (
    <div>
      <h1>404 - Página no encontrada</h1>
      <p>La ruta solicitada no existe.</p>
    </div>
  );
};

const HarvestRouter = () => {
  const routes = [
    {
      path: "/", // Esta ruta actúa como layout para todas las rutas que empiecen con "/"
      element: <MainLayout />, // Layout principal que envuelve todo
      children: [
        {
          path: "/",
          exact: true,
          element: <HomePage />,
        },
        {
          path: "/about",
          exact: true,
          element: <AboutPage />,
        },
        {
          path: "/test",
          element: <div>hola</div>,
        },
        {
          path: "*",
          element: <NotFoundPage />,
        },
      ],
    },
  ];
  return <Router routes={routes} />;
};

export default HarvestRouter;
