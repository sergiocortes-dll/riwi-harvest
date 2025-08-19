// index.js - Core completamente simplificado
import {
  endComponent,
  resetGlobalState,
  setReRenderFunction,
  startComponent,
} from "./hooks.js";

let appRootElement;
let rootComponent;
let isRendering = false;

export const Fragment = ({ children }) => {
  return Array.isArray(children) ? children : [children].filter(Boolean);
};

export const createElement = (type, props, ...children) => {
  if (typeof type === "function") {
    const componentName = type.name || "AnonymousComponent";

    // Iniciar el contexto del componente con un sistema simple
    startComponent(componentName);

    const componentProps = {
      ...(props || {}),
      children:
        children.length === 0
          ? undefined
          : children.length === 1
          ? children[0]
          : children,
    };

    let result;
    try {
      result = type(componentProps);
    } catch (error) {
      console.error(`Error rendering ${componentName}:`, error);
      result = createElement(
        "div",
        { style: { color: "red" } },
        `Error: ${error.message}`
      );
    } finally {
      endComponent();
    }

    return result;
  }

  if (type === Fragment) {
    return children.flat();
  }

  // Crear elemento DOM
  const element = document.createElement(type);

  // Aplicar props
  for (const key in props || {}) {
    if (key === "children" || key === "key") continue;

    if (key.startsWith("on") && typeof props[key] === "function") {
      const eventName = key.substring(2).toLowerCase();
      element.addEventListener(eventName, props[key]);
    } else if (key === "className") {
      element.setAttribute("class", props[key]);
    } else if (key === "htmlFor") {
      element.setAttribute("for", props[key]);
    } else if (key === "style" && typeof props[key] === "object") {
      Object.assign(element.style, props[key]);
    } else if (typeof props[key] === "boolean") {
      if (props[key]) {
        element.setAttribute(key, "");
      }
    } else if (props[key] !== null && props[key] !== undefined) {
      element.setAttribute(key, String(props[key]));
    }
  }

  // Renderizar children
  const renderChild = (child) => {
    if (child === null || child === undefined || child === false) {
      return null;
    }

    if (child === true) {
      return document.createTextNode("true");
    }

    if (typeof child === "object" && child instanceof HTMLElement) {
      return child;
    }

    if (Array.isArray(child)) {
      const fragment = document.createDocumentFragment();
      child.forEach((subChild) => {
        const rendered = renderChild(subChild);
        if (rendered) {
          fragment.appendChild(rendered);
        }
      });
      return fragment;
    }

    return document.createTextNode(String(child));
  };

  children.flat(Infinity).forEach((child) => {
    const rendered = renderChild(child);
    if (rendered) {
      element.appendChild(rendered);
    }
  });

  return element;
};

export const h = createElement;

export const render = (component, rootElement) => {
  appRootElement = rootElement;
  rootComponent = component;

  const reRender = () => {
    if (!appRootElement || !rootComponent || isRendering) return;

    isRendering = true;

    // Reset del estado global para hooks
    resetGlobalState();

    // Limpiar el DOM
    while (appRootElement.firstChild) {
      appRootElement.removeChild(appRootElement.firstChild);
    }

    // Renderizar inmediatamente (sin setTimeout ni requestAnimationFrame)
    try {
      const result = createElement(rootComponent, null);
      if (result) {
        appRootElement.appendChild(result);
      }
    } catch (error) {
      console.error("Error in render:", error);
      appRootElement.innerHTML = `<div style="color: red; padding: 20px;">Render Error: ${error.message}</div>`;
    } finally {
      isRendering = false;
    }
  };

  setReRenderFunction(reRender);
  reRender();
};

export * from "./hooks.js";
