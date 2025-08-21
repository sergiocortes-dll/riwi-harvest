// router.js - Router SPA corregido para funcionar con el sistema React-like

import { createElement } from "@harvest/core";

// Estado global del router
let currentPath = window.location.pathname;
let reRenderCallback = null;
let isAuthenticated = false;
let authRedirect = "/auth/login";
let lastRenderedPath = null;

// Función para establecer el callback de re-render
export const setRouterReRender = (callback) => {
  reRenderCallback = callback;
};

// Función para forzar re-render
const triggerReRender = () => {
  // Solo re-renderizar si el path realmente cambió
  if (currentPath !== lastRenderedPath && reRenderCallback) {
    console.log(
      "🔄 Router re-render triggered - Path changed from",
      lastRenderedPath,
      "to",
      currentPath
    );
    lastRenderedPath = currentPath;
    reRenderCallback();
  }
};

// Funciones de autenticación
export const setAuthenticated = (auth) => {
  isAuthenticated = auth;
  triggerReRender();
};

export const getAuthenticated = () => {
  return isAuthenticated;
};

export const setAuthRedirect = (path) => {
  authRedirect = path;
};

// Función para navegar
export const navigate = (path) => {
  if (currentPath === path) {
    console.log("🚫 Navigation cancelled - already at", path);
    return;
  }

  console.log("🧭 Navigating from", currentPath, "to", path);
  currentPath = path;
  window.history.pushState({}, "", path);
  triggerReRender();
};

// Componente Link
export const Link = ({
  to,
  children,
  className,
  style,
  onClick,
  replace = false,
}) => {
  const handleClick = (e) => {
    e.preventDefault();

    if (onClick) {
      onClick(e);
    }

    if (replace) {
      window.history.replaceState({}, "", to);
      currentPath = to;
    } else {
      navigate(to);
    }
  };

  return createElement(
    "a",
    {
      href: to,
      className,
      style,
      onClick: handleClick,
    },
    children
  );
};

// Función para normalizar rutas
const normalizePath = (path) => {
  if (!path || path === "/") return "/";
  return path.startsWith("/") ? path : `/${path}`;
};

// Función para hacer match de rutas - VERSION CON DEBUG
const matchRoute = (pattern, path) => {
  console.log("🎯 matchRoute - Pattern:", pattern, "Path:", path);

  // Normalizar ambas rutas
  const normalizedPattern = normalizePath(pattern);
  const normalizedPath = normalizePath(path);

  console.log(
    "🎯 matchRoute - Normalized Pattern:",
    normalizedPattern,
    "Normalized Path:",
    normalizedPath
  );

  // Match exacto
  if (normalizedPattern === normalizedPath) {
    console.log("✅ EXACT MATCH!");
    return { isMatch: true, params: {}, exactMatch: true };
  }

  // Split en segmentos
  const patternSegments = normalizedPattern.split("/").filter(Boolean);
  const pathSegments = normalizedPath.split("/").filter(Boolean);

  console.log("🔍 Pattern segments:", patternSegments);
  console.log("🔍 Path segments:", pathSegments);

  // Para rutas con parámetros
  if (patternSegments.length === pathSegments.length) {
    const params = {};
    let isMatch = true;

    for (let i = 0; i < patternSegments.length; i++) {
      if (patternSegments[i].startsWith(":")) {
        params[patternSegments[i].substring(1)] = pathSegments[i];
      } else if (patternSegments[i] !== pathSegments[i]) {
        isMatch = false;
        break;
      }
    }

    if (isMatch) {
      console.log("✅ PARAMETRIC MATCH!");
      return { isMatch: true, params, exactMatch: true };
    }
  }

  // Para rutas padre - MEJORADO
  // Solo considerar match de padre si la ruta padre es realmente padre de la ruta actual
  if (normalizedPattern === "/" && normalizedPath !== "/") {
    console.log("✅ ROOT PARENT MATCH!");
    return { isMatch: true, params: {}, exactMatch: false };
  }

  if (
    normalizedPattern !== "/" &&
    normalizedPath.startsWith(normalizedPattern + "/")
  ) {
    console.log("✅ PARENT MATCH!");
    return { isMatch: true, params: {}, exactMatch: false };
  }

  console.log("❌ NO MATCH");
  return { isMatch: false, params: {}, exactMatch: false };
};

// Función para construir el path completo de una ruta anidada - VERSION CON DEBUG
const buildFullPath = (parentPath, childPath) => {
  const normalizedParent = normalizePath(parentPath);
  const normalizedChild = normalizePath(childPath);

  console.log(
    "🔍 buildFullPath - Parent:",
    parentPath,
    "-> Normalized:",
    normalizedParent
  );
  console.log(
    "🔍 buildFullPath - Child:",
    childPath,
    "-> Normalized:",
    normalizedChild
  );

  // Si el child path ya es absoluto, usarlo tal como está
  if (normalizedChild.startsWith("/") && normalizedChild !== "/") {
    if (normalizedParent === "/") {
      console.log("✅ Result (absolute child, root parent):", normalizedChild);
      return normalizedChild;
    }
    const result = normalizedParent.replace(/\/$/, "") + normalizedChild;
    console.log("✅ Result (absolute child):", result);
    return result;
  }

  // Si es relativo, combinarlo con el parent
  if (normalizedParent === "/") {
    const result = normalizedChild === "/" ? "/" : normalizedChild;
    console.log("✅ Result (root parent):", result);
    return result;
  }

  if (normalizedChild === "/") {
    console.log("✅ Result (child is root):", normalizedParent);
    return normalizedParent;
  }

  const result =
    normalizedParent.replace(/\/$/, "") +
    "/" +
    normalizedChild.replace(/^\//, "");
  console.log("✅ Result (combined):", result);
  return result;
};

// Función para encontrar todas las rutas que coinciden (para rutas anidadas)
const findMatchingRoutes = (routes, currentPath, parentPath = "") => {
  const matches = [];

  for (const route of routes) {
    const fullPath = buildFullPath(parentPath, route.path);
    const match = matchRoute(fullPath, currentPath);

    if (match.isMatch) {
      const routeInfo = {
        ...route,
        fullPath,
        params: match.params,
        exactMatch: match.exactMatch,
      };

      matches.push(routeInfo);

      // Si tiene children, buscar siempre en ellos (no solo si no es exacto)
      if (route.children && route.children.length > 0) {
        const childMatches = findMatchingRoutes(
          route.children,
          currentPath,
          fullPath
        );
        matches.push(...childMatches);
      }
    }
  }

  return matches;
};

// Componente Outlet para renderizar children
export function Outlet({ className, style }) {
  console.log("🚪 Outlet renderizado");

  return createElement("div", {
    "data-outlet": "true",
    className,
    style,
  });
}

// Función para renderizar ruta con sus children
function renderRouteWithOutlet(element, childElement) {
  console.log(
    "🎨 renderRouteWithOutlet - element:",
    element,
    "childElement:",
    childElement
  );

  if (typeof element === "function") {
    console.log("🏗️ Executing function component with children:", childElement);

    // Crear las props con children
    const props = { children: childElement };

    // Ejecutar el componente con las props
    const result = element(props);
    console.log("✅ Component executed, result:", result);

    return result;
  } else {
    console.log("🔧 Element is not a function, returning as is");
    return element;
  }
}

// Función para construir la jerarquía de rutas
const buildRouteHierarchy = (routes, currentPath) => {
  const hierarchy = [];
  let foundCompleteMatch = false;

  const findRouteInHierarchy = (
    routesList,
    path,
    parentPath = "",
    level = 0
  ) => {
    for (const route of routesList) {
      const fullPath = buildFullPath(parentPath, route.path);
      const match = matchRoute(fullPath, path);

      console.log(
        `🔍 Level ${level} - Testing route:`,
        route.path,
        "Full path:",
        fullPath,
        "Match:",
        match
      );

      if (match.isMatch) {
        // Agregar esta ruta a la jerarquía
        hierarchy[level] = {
          ...route,
          fullPath,
          params: match.params,
          exactMatch: match.exactMatch,
          level,
        };

        console.log(
          `✅ Level ${level} - Added to hierarchy:`,
          hierarchy[level]
        );

        // Si es un match exacto, marcamos que encontramos una coincidencia completa
        if (match.exactMatch) {
          foundCompleteMatch = true;
          console.log("🎯 Found complete match!");
        }

        // Si tiene children, buscar en children
        if (route.children && route.children.length > 0) {
          console.log(`📁 Level ${level} - Searching in children...`);
          findRouteInHierarchy(route.children, path, fullPath, level + 1);
        }

        // IMPORTANTE: Solo hacer break si encontramos un match exacto
        // Si es un match de padre, seguir buscando en children
        if (match.exactMatch) {
          break;
        }
      }
    }
  };

  console.log("🚀 Building route hierarchy for path:", currentPath);
  findRouteInHierarchy(routes, currentPath);

  console.log("📊 Final hierarchy:", hierarchy);
  console.log("✅ Found complete match:", foundCompleteMatch);

  // Si encontramos rutas padre pero no hay match exacto para la ruta completa,
  // significa que la ruta no existe completamente
  const hasParentMatch = hierarchy.length > 0;

  return {
    hierarchy: hierarchy.filter(Boolean),
    isValidRoute: foundCompleteMatch,
    hasParentMatch,
  };
};

// Componente Router principal
export const Router = ({ routes, fallback = null }) => {
  // Configurar callback para re-render si no está configurado
  if (!reRenderCallback) {
    setRouterReRender(() => {
      window.dispatchEvent(new CustomEvent("router-update"));
    });
  }

  const currentPath = getCurrentPath();
  console.log("🎯 Router processing path:", currentPath);

  // Construir jerarquía de rutas
  const routeResult = buildRouteHierarchy(routes, currentPath);
  const {
    hierarchy: routeHierarchy,
    isValidRoute,
    hasParentMatch,
  } = routeResult;

  console.log("📊 Route hierarchy:", routeHierarchy);

  // Si no hay match válido, mostrar 404
  if (!isValidRoute) {
    const notFoundComponent =
      fallback ||
      createElement(
        "div",
        {
          style: { padding: "20px", textAlign: "center" },
        },
        createElement("h2", null, "404 - Page Not Found"),
        createElement("p", null, `No route found for: ${currentPath}`),
        createElement(Link, { to: "/" }, "Go to Home")
      );

    if (hasParentMatch && routeHierarchy.length > 0) {
      let result = notFoundComponent;
      for (let i = routeHierarchy.length - 1; i >= 0; i--) {
        const route = routeHierarchy[i];
        result = renderRouteWithOutlet(route.element, result);
      }
      return result;
    }

    return notFoundComponent;
  }

  // Verificar protección de rutas
  for (const route of routeHierarchy) {
    if (route.protected && !isAuthenticated) {
      setTimeout(() => navigate(authRedirect), 0);
      return createElement(
        "div",
        {
          style: { padding: "20px", textAlign: "center" },
        },
        "Redirecting to login..."
      );
    }
  }

  // Construir la jerarquía de componentes desde el nivel más profundo hacia arriba
  let result = null;

  // Empezar desde la ruta más específica (nivel más alto)
  for (let i = routeHierarchy.length - 1; i >= 0; i--) {
    const route = routeHierarchy[i];
    console.log(`🔧 Processing route level ${i}:`, route);

    if (i === routeHierarchy.length - 1) {
      // El componente más específico (hoja) - ejecutarlo si es función
      if (typeof route.element === "function") {
        console.log("🏗️ Executing leaf component:", route.element.name);
        result = createElement(route.element, null);
      } else {
        result = route.element;
      }
    } else {
      // Componente padre que debe envolver al hijo
      result = renderRouteWithOutlet(route.element, result);
    }
  }

  console.log("🎯 Final router result:", result);
  return result;
};

// Configurar listener del navegador
let isListenerSet = false;

export const setupRouter = () => {
  if (isListenerSet) return;

  isListenerSet = true;

  // Listener para navegación del navegador
  window.addEventListener("popstate", () => {
    currentPath = window.location.pathname;
    triggerReRender();
  });

  // Listener personalizado para actualizaciones del router
  window.addEventListener("router-update", () => {
    // Este evento puede ser usado por el sistema de render externo
  });

  currentPath = window.location.pathname;
};

// Funciones de utilidad
export const getCurrentPath = () => currentPath;

export const useParams = () => {
  // Implementación básica - en una implementación completa
  // se pasarían los parámetros a través del contexto
  return {};
};

// Auto-setup
setupRouter();
