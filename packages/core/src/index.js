import { endComponent, setReRenderFunction, startComponent } from "./hooks.js";

let appRootElement;
let rootComponent;
let componentInstanceCounters = new Map();

export const Fragment = ({ children }) => {
  return Array.isArray(children) ? children : [children].filter(Boolean);
};

export const createElement = (type, props, ...children) => {
  console.log("🏗️ createElement called with:", { type, props, children });

  if (typeof type === "function") {
    const componentName = type.name || "AnonymousComponent";

    if (!componentInstanceCounters.has(componentName)) {
      componentInstanceCounters.set(componentName, 0);
    }

    const key = props?.key;
    let instanceIndex;

    if (key !== undefined) {
      instanceIndex = key;
    } else {
      instanceIndex = componentInstanceCounters.get(componentName);
      componentInstanceCounters.set(componentName, instanceIndex + 1);
    }

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
      console.log("✅ Component result:", result);
    } finally {
      endComponent();
    }

    return result;
  }

  if (type === Fragment) {
    return children.flat();
  }

  console.log("🔧 Creating DOM element:", type);
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
    console.log("👶 Rendering child:", child, typeof child);

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

    // NUEVO: Verificar si es un objeto JSX de React
    if (typeof child === "object" && child !== null && child.$$typeof) {
      console.error("❌ Found React element - JSX pragma not working:", child);
      return document.createTextNode("[React Element - JSX Error]");
    }

    return document.createTextNode(String(child));
  };

  children.flat(Infinity).forEach((child) => {
    const rendered = renderChild(child);
    if (rendered) {
      element.appendChild(rendered);
    }
  });

  console.log("✅ DOM element created:", element);
  return element;
};

export const h = createElement;

export const render = (component, rootElement) => {
  appRootElement = rootElement;
  rootComponent = component;

  const reRender = () => {
    if (!appRootElement || !rootComponent) return;

    console.log("🔄 Starting re-render...");
    componentInstanceCounters.clear();

    while (appRootElement.firstChild) {
      appRootElement.removeChild(appRootElement.firstChild);
    }

    try {
      const result = createElement(rootComponent, null);
      console.log("📦 Render result:", result, typeof result);

      if (result && result instanceof Node) {
        appRootElement.appendChild(result);
        console.log("✅ Render successful");
      } else {
        console.error("❌ Render result is not a DOM Node:", result);
        // Crear un elemento de error
        const errorDiv = document.createElement("div");
        errorDiv.textContent =
          "Render Error: Component did not return a DOM node";
        errorDiv.style.color = "red";
        errorDiv.style.padding = "20px";
        appRootElement.appendChild(errorDiv);
      }
    } catch (error) {
      console.error("❌ Render error:", error);
      const errorDiv = document.createElement("div");
      errorDiv.textContent = `Error: ${error.message}`;
      errorDiv.style.color = "red";
      errorDiv.style.padding = "20px";
      appRootElement.appendChild(errorDiv);
    }
  };

  setReRenderFunction(reRender);
  reRender();
};

export * from "./hooks.js";
