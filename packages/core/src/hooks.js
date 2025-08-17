// packages/@harvest/core/src/hooks.js - Versión simplificada y funcional
let componentStates = new Map(); // Mapa global de estados por componente
let currentComponentPath = []; // Stack de componentes siendo renderizados
let componentCounter = 0; // Contador global para IDs únicos
let reRenderFunction = () => {};

export const setReRenderFunction = (fn) => {
  reRenderFunction = fn;
};

// Función para generar un ID único de componente basado en la jerarquía
const getCurrentComponentKey = () => {
  return currentComponentPath.join("-") || "root";
};

// Función para iniciar el render de un componente
export const startComponent = (componentName, instanceIndex = 0) => {
  const componentKey = `${componentName}_${instanceIndex}`;
  currentComponentPath.push(componentKey);

  // Inicializar el estado del componente si no existe
  const fullKey = getCurrentComponentKey();
  if (!componentStates.has(fullKey)) {
    componentStates.set(fullKey, { hooks: [], hookIndex: 0 });
  }

  // Resetear el índice de hooks para este componente
  componentStates.get(fullKey).hookIndex = 0;

  return fullKey;
};

// Función para finalizar el render de un componente
export const endComponent = () => {
  currentComponentPath.pop();
};

export const useState = (initialState) => {
  const componentKey = getCurrentComponentKey();
  const componentState = componentStates.get(componentKey);

  if (!componentState) {
    throw new Error(
      `useState llamado fuera de un componente válido. ComponentKey: ${componentKey}`
    );
  }

  const hookIndex = componentState.hookIndex;

  // Inicializar el hook si no existe
  if (componentState.hooks[hookIndex] === undefined) {
    componentState.hooks[hookIndex] = initialState;
  }

  const setState = (newStateOrUpdater) => {
    const prevState = componentState.hooks[hookIndex];
    const newState =
      typeof newStateOrUpdater === "function"
        ? newStateOrUpdater(prevState)
        : newStateOrUpdater;

    if (!Object.is(prevState, newState)) {
      componentState.hooks[hookIndex] = newState;
      setTimeout(reRenderFunction, 0);
    }
  };

  componentState.hookIndex++;
  return [componentState.hooks[hookIndex], setState];
};

// Función de debug para ver todos los estados
export const debugStates = () => {
  const states = {};
  for (const [key, value] of componentStates) {
    states[key] = value.hooks;
  }
  console.log("Estados actuales:", states);
  return states;
};
