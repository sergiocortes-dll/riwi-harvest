import { endComponent, setReRenderFunction, startComponent } from "./hooks.js";

let appRootElement;
let rootComponent;
let componentInstanceCounters = new Map(); // Para rastrear instancias de cada tipo de componente

export const Fragment = ({ children }) => {
  return Array.isArray(children) ? children : [children].filter(Boolean);
};

export const createElement = (type, props, ...children) => {
  if (typeof type === "function") {
    // Obtener nombre del componente
    const componentName = type.name || "AnonymousComponent";

    // Manejar instancias múltiples del mismo componente
    if (!componentInstanceCounters.has(componentName)) {
      componentInstanceCounters.set(componentName, 0);
    }

    // Buscar si hay una key explícita en props
    const key = props?.key;
    let instanceIndex;

    if (key !== undefined) {
      // Si hay key, usarla como identificador único
      instanceIndex = key;
    } else {
      // Si no hay key, usar contador automático
      instanceIndex = componentInstanceCounters.get(componentName);
      componentInstanceCounters.set(componentName, instanceIndex + 1);
    }

    // Iniciar el contexto del componente
    const componentKey = startComponent(componentName, instanceIndex);

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
    } finally {
      // Siempre finalizar el contexto, incluso si hay error
      endComponent();
    }

    return result;
  }

  if (type === Fragment) {
    return children.flat();
  }

  const element = document.createElement(type);

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
    if (!appRootElement || !rootComponent) return;

    // Resetear contadores de instancias para el nuevo render
    componentInstanceCounters.clear();

    // Limpiar contenido anterior
    while (appRootElement.firstChild) {
      appRootElement.removeChild(appRootElement.firstChild);
    }

    // CRÍTICO: Usar createElement para renderizar el componente raíz
    // Esto asegura que se inicialice el contexto del componente
    const result = createElement(rootComponent, null);

    if (result) {
      appRootElement.appendChild(result);
    }
  };

  setReRenderFunction(reRender);
  reRender();
};

export * from "./hooks.js";
