// router.js - Router SPA con manejo completo de parámetros

import { createElement } from "@harvest/core";

// Estado global del router
let currentPath = window.location.pathname;
let reRenderCallback = null;
let isAuthenticated = false;
let authRedirect = "/auth/login";
let lastRenderedPath = null;
let currentParams = {}; // Almacenar parámetros actuales
let currentQuery = {}; // Almacenar query parameters

// Función para establecer el callback de re-render
export const setRouterReRender = (callback) => {
  reRenderCallback = callback;
};

// Función para forzar re-render
const triggerReRender = () => {
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

// Función para parsear query parameters
const parseQuery = (search) => {
  const query = {};
  if (search) {
    const params = new URLSearchParams(search);
    for (const [key, value] of params) {
      query[key] = value;
    }
  }
  return query;
};

// Función para actualizar el estado actual del path y parámetros
const updateCurrentState = () => {
  currentPath = window.location.pathname;
  currentQuery = parseQuery(window.location.search);
};

// Función para navegar
export const navigate = (path, options = {}) => {
  const { replace = false, state = null } = options;

  if (currentPath === path) {
    console.log("🚫 Navigation cancelled - already at", path);
    return;
  }

  console.log("🧭 Navigating from", currentPath, "to", path);

  if (replace) {
    window.history.replaceState(state, "", path);
  } else {
    window.history.pushState(state, "", path);
  }

  updateCurrentState();
  triggerReRender();
};

// Componente Link mejorado
export const Link = ({
  to,
  children,
  className,
  style,
  onClick,
  replace = false,
  state = null,
}) => {
  const handleClick = (e) => {
    e.preventDefault();

    if (onClick) {
      onClick(e);
    }

    navigate(to, { replace, state });
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

// Función mejorada para hacer match de rutas con parámetros
const matchRoute = (pattern, path) => {
  console.log("🎯 matchRoute - Pattern:", pattern, "Path:", path);

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
      const patternSegment = patternSegments[i];
      const pathSegment = pathSegments[i];

      if (patternSegment.startsWith(":")) {
        // Extraer parámetro
        const paramName = patternSegment.substring(1);

        // Validar parámetros opcionales (terminan con ?)
        if (paramName.endsWith("?")) {
          const actualParamName = paramName.slice(0, -1);
          params[actualParamName] = pathSegment || null;
        } else {
          params[paramName] = pathSegment;
        }

        console.log(`📝 Parameter extracted: ${paramName} = ${pathSegment}`);
      } else if (patternSegment.includes("*")) {
        // Wildcard - captura el resto de la ruta
        const paramName = patternSegment.replace("*", "");
        const remainingSegments = pathSegments.slice(i);
        params[paramName] = remainingSegments.join("/");
        console.log(
          `🌟 Wildcard captured: ${paramName} = ${params[paramName]}`
        );
        break;
      } else if (patternSegment !== pathSegment) {
        isMatch = false;
        break;
      }
    }

    if (isMatch) {
      console.log("✅ PARAMETRIC MATCH! Params:", params);
      return { isMatch: true, params, exactMatch: true };
    }
  }

  // Para rutas padre
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

// Función para construir el path completo de una ruta anidada
const buildFullPath = (parentPath, childPath) => {
  const normalizedParent = normalizePath(parentPath);
  const normalizedChild = normalizePath(childPath);

  if (normalizedChild.startsWith("/") && normalizedChild !== "/") {
    if (normalizedParent === "/") {
      return normalizedChild;
    }
    return normalizedParent.replace(/\/$/, "") + normalizedChild;
  }

  if (normalizedParent === "/") {
    return normalizedChild === "/" ? "/" : normalizedChild;
  }

  if (normalizedChild === "/") {
    return normalizedParent;
  }

  return (
    normalizedParent.replace(/\/$/, "") +
    "/" +
    normalizedChild.replace(/^\//, "")
  );
};

// Función mejorada para construir la jerarquía de rutas con parámetros
const buildRouteHierarchy = (routes, currentPath) => {
  const hierarchy = [];
  let foundCompleteMatch = false;
  let allParams = {}; // Acumular todos los parámetros

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
        // Acumular parámetros de todos los niveles
        allParams = { ...allParams, ...match.params };

        hierarchy[level] = {
          ...route,
          fullPath,
          params: match.params,
          allParams: { ...allParams }, // Parámetros de toda la jerarquía
          exactMatch: match.exactMatch,
          level,
        };

        console.log(
          `✅ Level ${level} - Added to hierarchy:`,
          hierarchy[level]
        );

        if (match.exactMatch) {
          foundCompleteMatch = true;
          console.log("🎯 Found complete match!");
        }

        if (route.children && route.children.length > 0) {
          console.log(`📁 Level ${level} - Searching in children...`);
          findRouteInHierarchy(route.children, path, fullPath, level + 1);
        }

        if (match.exactMatch) {
          break;
        }
      }
    }
  };

  console.log("🚀 Building route hierarchy for path:", currentPath);
  findRouteInHierarchy(routes, currentPath);

  // Actualizar parámetros globales
  const finalHierarchy = hierarchy.filter(Boolean);
  if (finalHierarchy.length > 0) {
    const lastRoute = finalHierarchy[finalHierarchy.length - 1];
    currentParams = lastRoute.allParams || {};
  } else {
    currentParams = {};
  }

  console.log("📊 Final hierarchy:", finalHierarchy);
  console.log("📋 Final params:", currentParams);

  return {
    hierarchy: finalHierarchy,
    isValidRoute: foundCompleteMatch,
    hasParentMatch: finalHierarchy.length > 0,
  };
};

// Componente Outlet mejorado que pasa parámetros
export function Outlet({ className, style }) {
  console.log("🚪 Outlet renderizado con parámetros:", currentParams);

  return createElement("div", {
    "data-outlet": "true",
    className,
    style,
  });
}

// Función mejorada para renderizar ruta con parámetros
function renderRouteWithOutlet(route, childElement) {
  console.log(
    "🎨 renderRouteWithOutlet - route:",
    route.path,
    "params:",
    route.allParams
  );

  if (typeof route.element === "function") {
    console.log("🏗️ Executing function component with params and children");

    // Crear las props con parámetros, query y children
    const props = {
      params: route.allParams || {},
      searchParams: currentQuery,
      children: childElement,
    };

    const result = route.element(props);
    console.log("✅ Component executed with props:", props);

    return result;
  } else {
    console.log("🔧 Element is not a function, returning as is");
    return route.element;
  }
}

// Componente Router principal mejorado
export const Router = ({ routes, fallback = null }) => {
  if (!reRenderCallback) {
    setRouterReRender(() => {
      window.dispatchEvent(new CustomEvent("router-update"));
    });
  }

  // Actualizar estado actual
  updateCurrentState();
  const currentPath = getCurrentPath();

  console.log("🎯 Router processing path:", currentPath);
  console.log("🔍 Current query:", currentQuery);

  const routeResult = buildRouteHierarchy(routes, currentPath);
  const {
    hierarchy: routeHierarchy,
    isValidRoute,
    hasParentMatch,
  } = routeResult;

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
        result = renderRouteWithOutlet(route, result);
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

  // Construir la jerarquía de componentes
  let result = null;

  for (let i = routeHierarchy.length - 1; i >= 0; i--) {
    const route = routeHierarchy[i];
    console.log(`🔧 Processing route level ${i}:`, route);

    if (i === routeHierarchy.length - 1) {
      // Componente más específico (hoja)
      if (typeof route.element === "function") {
        const props = {
          params: route.allParams || {},
          searchParams: currentQuery,
        };
        result = createElement(route.element, props);
      } else {
        result = route.element;
      }
    } else {
      // Componente padre
      result = renderRouteWithOutlet(route, result);
    }
  }

  console.log("🎯 Final router result:", result);
  return result;
};

// Hook para obtener parámetros (funciona como React Router)
export const useParams = () => {
  console.log("📋 useParams called, returning:", currentParams);
  return currentParams;
};

// Hook para obtener query parameters
export const useSearchParams = () => {
  console.log("🔍 useSearchParams called, returning:", currentQuery);
  return currentQuery;
};

// Hook para obtener información de la ubicación actual
export const useLocation = () => {
  return {
    pathname: currentPath,
    search: window.location.search,
    hash: window.location.hash,
    state: window.history.state,
    params: currentParams,
    searchParams: currentQuery,
  };
};

// Configurar listener del navegador
let isListenerSet = false;

export const setupRouter = () => {
  if (isListenerSet) return;

  isListenerSet = true;

  window.addEventListener("popstate", () => {
    updateCurrentState();
    triggerReRender();
  });

  window.addEventListener("router-update", () => {
    // Evento personalizado para actualizaciones del router
  });

  updateCurrentState();
};

// Funciones de utilidad
export const getCurrentPath = () => currentPath;

// Auto-setup
setupRouter();
