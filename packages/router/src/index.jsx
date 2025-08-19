// router.jsx - Versión corregida y reactiva
import { createElement, useEffect, useState } from "@harvest/core";

// --- Estado global del router ---
let currentPath = window.location.pathname;
let subscribers = [];

const notifySubscribers = () => {
  subscribers.forEach((callback) => callback());
};

// --- NUEVO: Store reactivo para Outlet ---
let currentOutletContent = null;
let outletSubscribers = [];

const notifyOutletSubscribers = () => {
  outletSubscribers.forEach((callback) => callback(currentOutletContent));
};

const setOutletContent = (element) => {
  console.log("setOutletContent called. New content:", element);
  currentOutletContent = element;
  notifyOutletSubscribers();
  console.log("notifyOutletSubscribers called.");
};

// --- Hooks ---
export const useLocation = () => {
  const [path, setPath] = useState(currentPath);

  useEffect(() => {
    const callback = () => setPath(currentPath);
    subscribers.push(callback);

    return () => {
      subscribers = subscribers.filter((cb) => cb !== callback);
    };
  }, []);

  return path;
};

export const useNavigate = () => {
  return (path) => {
    if (path !== currentPath) {
      currentPath = path;
      window.history.pushState({}, "", path);
      notifySubscribers();
    }
  };
};

// --- NUEVO: Hook para el Outlet ---
export const useOutlet = () => {
  const [content, setContent] = useState(currentOutletContent);
  console.log("useOutlet initial content:", content); // Al montar

  useEffect(() => {
    const callback = (newContent) => {
      console.log("useOutlet subscriber received new content:", newContent);
      setContent(newContent);
    };
    outletSubscribers.push(callback);
    console.log(
      "useOutlet subscribed. Total subscribers:",
      outletSubscribers.length
    );

    return () => {
      outletSubscribers = outletSubscribers.filter((cb) => cb !== callback);
      console.log(
        "useOutlet unsubscribed. Total subscribers:",
        outletSubscribers.length
      );
    };
  }, []);
  return content;
};

// --- Componente Outlet reactivo ---
export const Outlet = () => {
  const content = useOutlet();
  console.log("🔌 Outlet rendering with reactive content:", content); // <-- ¿Qué valor tiene 'content' aquí?
  return content;
};

// --- Lógica de enrutamiento ---
const matchRoute = (route, path) => {
  if (route.path === "*") return true;
  if (route.exact) return route.path === path;
  return path.startsWith(route.path);
};

const findMatchingRoute = (routes, path) => {
  const exactMatch = routes.find((route) => route.exact && route.path === path);
  if (exactMatch) return exactMatch;

  const nonExactRoutes = routes
    .filter((route) => !route.exact && route.path !== "*")
    .sort((a, b) => b.path.length - a.path.length);

  const prefixMatch = nonExactRoutes.find((route) =>
    path.startsWith(route.path)
  );
  if (prefixMatch) return prefixMatch;

  return routes.find((route) => route.path === "*");
};

const resolveRoutes = (routes, path) => {
  console.log("RESOLVING ROUTES for path:", path);
  for (const route of routes) {
    console.log("  Checking route:", route.path);
    if (route.children && route.children.length > 0) {
      if (route.path === "/" || path.startsWith(route.path)) {
        const childPath =
          route.path === "/" ? path : path.substring(route.path.length) || "/";
        console.log("    Found parent route, checking childPath:", childPath);
        const matchingChild = findMatchingRoute(route.children, childPath);

        if (matchingChild) {
          console.log(
            "    MATCHING CHILD FOUND:",
            matchingChild.path,
            "Element:",
            matchingChild.element
          );
          setOutletContent(matchingChild.element);
          console.log(
            "    setOutletContent called with:",
            matchingChild.element
          );
          return route.element;
        }
      }
    } else {
      if (matchRoute(route, path)) {
        console.log(
          "  DIRECT MATCH FOUND:",
          route.path,
          "Element:",
          route.element
        );
        setOutletContent(null);
        return route.element;
      }
    }
  }
  console.log("NO ROUTE FOUND for path:", path);
  setOutletContent(null);
  return null;
};

// --- Componente Router principal ---
// Componente Router principal - VERSIÓN CORREGIDA
export const Router = ({ routes }) => {
  const path = useLocation();

  // 1. Añadimos un estado local para guardar el elemento que coincide con la ruta.
  // Lo inicializamos a null para poder manejar un estado de "carga" o "no encontrado" inicial.
  const [matchedElement, setMatchedElement] = useState(null);

  // useEffect para el manejo del historial (popstate), sin cambios.
  useEffect(() => {
    const handlePopState = () => {
      currentPath = window.location.pathname;
      notifySubscribers();
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // 2. NUEVO useEffect para manejar la lógica de resolución de rutas.
  // Este hook se ejecutará solo cuando 'path' cambie.
  useEffect(() => {
    console.log("🗺️ Router EFFECT processing path:", path);

    // La lógica con efectos secundarios ahora vive aquí, de forma segura.
    const element = resolveRoutes(routes, path);

    // Actualizamos el estado local del Router con el nuevo elemento.
    setMatchedElement(element);
  }, [path, routes]); // Se ejecuta cuando la ruta (path) o las definiciones de rutas (routes) cambian.

  console.log("🎯 Router rendering with matched element:", matchedElement);

  // 3. El cuerpo del componente ahora es "puro". Solo se encarga de renderizar
  // el estado actual de 'matchedElement'.
  if (!matchedElement) {
    // Puedes poner un "Cargando..." o un 404 por defecto mientras se resuelve la primera ruta.
    return createElement("div", null, "Route not found");
  }

  if (matchedElement.type && typeof matchedElement.type === "function") {
    return createElement(matchedElement.type, matchedElement.props || {});
  }

  return matchedElement;
};

// --- Componentes auxiliares (sin cambios) ---
export const Link = ({ to, children, ...props }) => {
  const navigate = useNavigate();
  const handleClick = (e) => {
    e.preventDefault();
    navigate(to);
  };
  return createElement(
    "a",
    { href: to, onClick: handleClick, ...props },
    children
  );
};

export const Route = ({ path, exact, element }) => null;

export const Navigate = ({ to }) => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(to);
  }, [to, navigate]);
  return null;
};
