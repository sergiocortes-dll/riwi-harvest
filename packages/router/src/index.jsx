// router.jsx - Versión corregida y reactiva
import { createElement, useEffect, useState } from "@harvest/core";

// --- Estado global del router ---
let currentPath = window.location.pathname;
let subscribers = [];

const notifySubscribers = () => {
  subscribers.forEach((callback) => callback());
};

// --- Store reactivo para Outlet - CORREGIDO ---
let currentOutletContent = null;
let outletSubscribers = [];

const notifyOutletSubscribers = () => {
  console.log(
    "🔄 Notifying outlet subscribers, total:",
    outletSubscribers.length
  );

  outletSubscribers.forEach((callback, index) => {
    console.log(
      `📞 Calling outlet subscriber ${index} with:`,
      currentOutletContent
    );
    try {
      callback(currentOutletContent);
    } catch (error) {
      console.error(`Error in outlet subscriber ${index}:`, error);
    }
  });
};

const setOutletContent = (element) => {
  console.log("📝 setOutletContent called with:", element);

  // Guardamos directamente el elemento, no una función
  const oldContent = currentOutletContent;
  currentOutletContent = element;

  console.log(
    "📝 Content changed from:",
    oldContent,
    "to:",
    currentOutletContent
  );

  // Notificar inmediatamente a todos los suscriptores
  notifyOutletSubscribers();
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

// --- Hook para el Outlet - SIMPLIFICADO ---
export const useOutlet = () => {
  const [content, setContent] = useState(currentOutletContent);

  console.log("🎯 useOutlet hook - current content:", content);
  console.log(
    "🔍 useOutlet hook - global currentOutletContent:",
    currentOutletContent
  );

  useEffect(() => {
    const callback = (newContent) => {
      console.log("📡 useOutlet received update:", newContent);
      setContent(newContent);
    };

    outletSubscribers.push(callback);
    console.log(
      "➕ useOutlet subscribed. Total subscribers:",
      outletSubscribers.length
    );

    return () => {
      outletSubscribers = outletSubscribers.filter((cb) => cb !== callback);
      console.log(
        "➖ useOutlet unsubscribed. Total subscribers:",
        outletSubscribers.length
      );
    };
  }, []);

  return content;
};

// --- Componente Outlet - VERSIÓN LIMPIA ---
export const Outlet = () => {
  const content = useOutlet();

  console.log(
    "🔌 Outlet rendering with content:",
    content,
    "global:",
    currentOutletContent
  );

  // Usar el contenido global si el local no está actualizado
  const actualContent = content || currentOutletContent;

  // Si no hay contenido, mostrar placeholder
  if (!actualContent) {
    console.log("⚠️ Outlet: No content available");
    return createElement("div", null, "No content");
  }

  // Si el contenido es un elemento JSX/objeto con type y props
  if (
    actualContent &&
    typeof actualContent === "object" &&
    actualContent.type
  ) {
    console.log(
      "✅ Outlet: Rendering JSX element with type:",
      actualContent.type
    );
    return createElement(actualContent.type, actualContent.props || {});
  }

  // Si es un elemento DOM ya creado
  if (actualContent && actualContent instanceof HTMLElement) {
    console.log("✅ Outlet: Rendering DOM element");
    return actualContent;
  }

  // Si es cualquier otra cosa, intentar renderizarla como texto
  console.log("⚠️ Outlet: Rendering as text/fallback");
  return createElement("div", null, String(actualContent));
};

// --- Lógica de enrutamiento - MEJORADA ---
const matchRoute = (route, path) => {
  if (route.path === "*") return true;
  if (route.exact) return route.path === path;
  return path.startsWith(route.path);
};

const findMatchingRoute = (routes, path) => {
  console.log(
    "🔍 Finding matching route for:",
    path,
    "in routes:",
    routes.map((r) => r.path)
  );

  // Primero buscar coincidencias exactas
  const exactMatch = routes.find((route) => route.exact && route.path === path);
  if (exactMatch) {
    console.log("✅ Found exact match:", exactMatch.path);
    return exactMatch;
  }

  // Luego rutas no exactas, ordenadas por longitud descendente
  const nonExactRoutes = routes
    .filter((route) => !route.exact && route.path !== "*")
    .sort((a, b) => b.path.length - a.path.length);

  const prefixMatch = nonExactRoutes.find((route) =>
    path.startsWith(route.path)
  );
  if (prefixMatch) {
    console.log("✅ Found prefix match:", prefixMatch.path);
    return prefixMatch;
  }

  // Finalmente, la ruta wildcard
  const wildcardMatch = routes.find((route) => route.path === "*");
  if (wildcardMatch) {
    console.log("✅ Found wildcard match:", wildcardMatch.path);
  }

  return wildcardMatch;
};

const resolveRoutes = (routes, path) => {
  console.log("🗺️ RESOLVING ROUTES for path:", path);

  for (const route of routes) {
    console.log(
      "🔍 Checking route:",
      route.path,
      "has children:",
      !!route.children
    );

    if (route.children && route.children.length > 0) {
      // Si esta ruta tiene hijos y coincide con el prefijo
      if (route.path === "/" || path.startsWith(route.path)) {
        const childPath =
          route.path === "/" ? path : path.substring(route.path.length) || "/";
        console.log("👶 Checking children for childPath:", childPath);

        const matchingChild = findMatchingRoute(route.children, childPath);

        if (matchingChild) {
          console.log("🎯 MATCHING CHILD FOUND:", matchingChild.path);
          console.log("📤 Setting outlet content to:", matchingChild.element);

          // Establecer el contenido del outlet
          setOutletContent(matchingChild.element);

          // Retornar el elemento padre (layout)
          return route.element;
        } else {
          console.log("❌ No matching child found for:", childPath);
        }
      }
    } else {
      // Ruta sin hijos
      if (matchRoute(route, path)) {
        console.log("🎯 DIRECT MATCH FOUND:", route.path);
        setOutletContent(null);
        return route.element;
      }
    }
  }

  console.log("❌ NO ROUTE FOUND for path:", path);
  setOutletContent(null);
  return createElement("div", null, "404 - Route not found");
};

// --- Componente Router principal - VERSIÓN CON ESTADO INTERNO ---
export const Router = ({ routes }) => {
  const path = useLocation();
  const [matchedElement, setMatchedElement] = useState(null);
  const [internalRoutes, setInternalRoutes] = useState(routes);

  // useEffect para el manejo del historial
  useEffect(() => {
    const handlePopState = () => {
      currentPath = window.location.pathname;
      notifySubscribers();
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Solo actualizar routes internamente cuando realmente cambien
  useEffect(() => {
    // Comparación simple por referencia - si routes cambia intencionalmente,
    // será una nueva referencia
    if (routes !== internalRoutes) {
      console.log("🔄 Routes prop changed, updating internal routes");
      setInternalRoutes(routes);
    }
  }, []);

  // useEffect para resolver rutas - solo depende de path e internalRoutes
  useEffect(() => {
    console.log("🗺️ Router EFFECT processing path:", path);

    const element = resolveRoutes(internalRoutes, path);
    console.log("📍 Router resolved element:", element);

    setMatchedElement(element);
  }, [path, internalRoutes]);

  console.log("🎯 Router rendering with matched element:", matchedElement);

  if (!matchedElement) {
    return createElement("div", null, "Loading...");
  }

  // Si es un objeto JSX con type y props
  if (matchedElement.type && typeof matchedElement.type === "function") {
    return createElement(matchedElement.type, matchedElement.props || {});
  }

  return matchedElement;
};

// --- Componentes auxiliares ---
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
