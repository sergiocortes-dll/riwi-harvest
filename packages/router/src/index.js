// router.js - Router SPA corregido para funcionar con el sistema React-like

import { createElement } from "@harvest/core";

// Estado global del router
let currentPath = window.location.pathname;
let reRenderCallback = null;
let isAuthenticated = false;
let authRedirect = "/auth/login";

// Función para establecer el callback de re-render
export const setRouterReRender = (callback) => {
  reRenderCallback = callback;
};

// Función para forzar re-render
const triggerReRender = () => {
  if (reRenderCallback) {
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
  if (currentPath === path) return;

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

// Función para hacer match de rutas
const matchRoute = (pattern, path) => {
  // Normalizar ambas rutas
  const normalizedPattern = normalizePath(pattern);
  const normalizedPath = normalizePath(path);

  // Match exacto
  if (normalizedPattern === normalizedPath) {
    return { isMatch: true, params: {}, exactMatch: true };
  }

  // Split en segmentos
  const patternSegments = normalizedPattern.split("/").filter(Boolean);
  const pathSegments = normalizedPath.split("/").filter(Boolean);

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
      return { isMatch: true, params, exactMatch: true };
    }
  }

  // Para rutas padre (verificar si el path actual empieza con el pattern)
  if (
    normalizedPath.startsWith(normalizedPattern + "/") ||
    (normalizedPattern !== "/" && normalizedPath.startsWith(normalizedPattern))
  ) {
    return { isMatch: true, params: {}, exactMatch: false };
  }

  return { isMatch: false, params: {}, exactMatch: false };
};

// Función para construir el path completo de una ruta anidada
const buildFullPath = (parentPath, childPath) => {
  const normalizedParent = normalizePath(parentPath);
  const normalizedChild = normalizePath(childPath);

  // Si el child path ya es absoluto, usarlo tal como está
  if (normalizedChild.startsWith("/") && normalizedChild !== "/") {
    if (normalizedParent === "/") {
      return normalizedChild;
    }
    return normalizedParent.replace(/\/$/, "") + normalizedChild;
  }

  // Si es relativo, combinarlo con el parent
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
export const Outlet = ({ className, style }) => {
  return createElement("div", {
    "data-outlet": "true",
    className,
    style,
  });
};

// Función para renderizar ruta con sus children
const renderRouteWithOutlet = (element, childElement) => {
  // Si es una función componente
  if (typeof element === "function") {
    const ComponentFunction = element;

    // Crear un wrapper que pase children al componente
    const WrappedComponent = (props) => {
      return ComponentFunction({ ...props, children: childElement });
    };

    return createElement(WrappedComponent, null);
  }

  // Si es un elemento HTML ya renderizado
  if (element && element instanceof HTMLElement) {
    const cloned = element.cloneNode(true);
    const outlet = cloned.querySelector('[data-outlet="true"]');
    if (outlet && childElement) {
      if (childElement instanceof HTMLElement) {
        outlet.replaceWith(childElement);
      } else {
        outlet.innerHTML = "";
        outlet.appendChild(childElement);
      }
    } else if (childElement && !outlet) {
      cloned.appendChild(childElement);
    }
    return cloned;
  }

  // Si ya es un elemento JSX/createElement, necesitamos recrearlo con children
  if (element && typeof element === "object") {
    // Para elementos JSX creados con createElement que pueden tener type y props
    if (element.type && typeof element.type === "function") {
      const Component = element.type;
      const props = element.props || {};
      return createElement(Component, { ...props, children: childElement });
    }

    // Crear un div wrapper que contenga tanto el elemento como el child
    return createElement("div", null, element, childElement);
  }

  return childElement || element;
};

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

      if (match.isMatch) {
        // Agregar esta ruta a la jerarquía
        hierarchy[level] = {
          ...route,
          fullPath,
          params: match.params,
          exactMatch: match.exactMatch,
          level,
        };

        // Si es un match exacto, marcamos que encontramos una coincidencia completa
        if (match.exactMatch) {
          foundCompleteMatch = true;
        }

        // Si tiene children, buscar en children
        if (route.children && route.children.length > 0) {
          findRouteInHierarchy(route.children, path, fullPath, level + 1);
        }

        break;
      }
    }
  };

  findRouteInHierarchy(routes, currentPath);

  // Si encontramos rutas padre pero no hay match exacto para la ruta completa,
  // significa que la ruta no existe completamente
  const hasParentMatch = hierarchy.length > 0;
  const isValidRoute =
    foundCompleteMatch ||
    (hierarchy.length > 0 &&
      !currentPath.includes(
        "/",
        hierarchy[hierarchy.length - 1].fullPath.length
      ));

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
      // Forzar re-render del componente padre
      window.dispatchEvent(new CustomEvent("router-update"));
    });
  }

  const currentPath = getCurrentPath();

  // Construir jerarquía de rutas
  const routeResult = buildRouteHierarchy(routes, currentPath);
  const {
    hierarchy: routeHierarchy,
    isValidRoute,
    hasParentMatch,
  } = routeResult;

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

    // Si hay un padre pero no se encontró la ruta hija, renderizar el 404 dentro del layout padre
    if (hasParentMatch && routeHierarchy.length > 0) {
      let result = notFoundComponent;

      // Construir la jerarquía con el 404 como componente final
      for (let i = routeHierarchy.length - 1; i >= 0; i--) {
        const route = routeHierarchy[i];
        result = renderRouteWithOutlet(route.element, result);
      }

      return result;
    }

    // Si no hay padre, mostrar 404 standalone
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

    if (i === routeHierarchy.length - 1) {
      // El componente más específico (hoja) - este es el componente final
      result = route.element;
    } else {
      // Componente padre que debe envolver al hijo
      result = renderRouteWithOutlet(route.element, result);
    }
  }

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
