// hooks.js - Versión completamente simplificada
let componentStates = new Map();
let componentStack = []; // Stack simple de componentes
let reRenderFunction = () => {};
let renderDepth = 0;
const MAX_RENDER_DEPTH = 100;
let globalComponentId = 0; // ID global incremental

export const setReRenderFunction = (fn) => {
  reRenderFunction = fn;
};

// Generar ID único y simple
const generateComponentId = () => {
  return `component_${++globalComponentId}`;
};

export const startComponent = (componentName) => {
  if (renderDepth > MAX_RENDER_DEPTH) {
    console.warn("Maximum render depth exceeded");
    renderDepth = 0;
    return "error_component";
  }

  renderDepth++;

  // Generar un ID único simple
  const componentId = generateComponentId();

  componentStack.push(componentId);

  // Inicializar estado del componente
  if (!componentStates.has(componentId)) {
    componentStates.set(componentId, {
      hooks: [],
      effects: [],
      hookIndex: 0,
      name: componentName,
    });
  }

  const state = componentStates.get(componentId);
  state.hookIndex = 0;

  return componentId;
};

export const endComponent = () => {
  if (componentStack.length > 0) {
    componentStack.pop();
  }
  renderDepth = Math.max(0, renderDepth - 1);
};

export const getCurrentComponentId = () => {
  return componentStack.length > 0
    ? componentStack[componentStack.length - 1]
    : null;
};

// Comparar dependencias
const areDepsEqual = (prevDeps, nextDeps) => {
  if (prevDeps === null && nextDeps === null) return true;
  if (prevDeps === null || nextDeps === null) return false;
  if (prevDeps.length !== nextDeps.length) return false;

  for (let i = 0; i < prevDeps.length; i++) {
    if (!Object.is(prevDeps[i], nextDeps[i])) {
      return false;
    }
  }
  return true;
};

export const useState = (initialState) => {
  const componentId = getCurrentComponentId();

  if (!componentId) {
    throw new Error(`useState called outside of valid component`);
  }

  const componentState = componentStates.get(componentId);

  if (!componentState) {
    throw new Error(`Component state not found for ID: ${componentId}`);
  }

  const hookIndex = componentState.hookIndex;

  // Inicializar el hook si no existe
  if (componentState.hooks[hookIndex] === undefined) {
    componentState.hooks[hookIndex] =
      typeof initialState === "function" ? initialState() : initialState;
  }

  const currentState = componentState.hooks[hookIndex];

  // Crear setter que captura el índice actual
  const setState = (newStateOrUpdater) => {
    const prevState = componentState.hooks[hookIndex];
    const newState =
      typeof newStateOrUpdater === "function"
        ? newStateOrUpdater(prevState)
        : newStateOrUpdater;

    if (!Object.is(prevState, newState)) {
      componentState.hooks[hookIndex] = newState;

      // Programar re-render
      setTimeout(() => reRenderFunction(), 0);
    }
  };

  componentState.hookIndex++;
  return [currentState, setState];
};

export const useEffect = (effect, deps) => {
  const componentId = getCurrentComponentId();

  if (!componentId) {
    throw new Error(`useEffect called outside of valid component`);
  }

  const componentState = componentStates.get(componentId);

  if (!componentState) {
    throw new Error(`Component state not found for ID: ${componentId}`);
  }

  const hookIndex = componentState.hookIndex;

  if (!componentState.effects) {
    componentState.effects = [];
  }

  const prevEffect = componentState.effects[hookIndex];
  let shouldRunEffect = false;

  if (!prevEffect) {
    shouldRunEffect = true;
  } else if (deps === undefined) {
    shouldRunEffect = true;
  } else if (deps === null || (Array.isArray(deps) && deps.length === 0)) {
    shouldRunEffect = false;
  } else {
    shouldRunEffect = !areDepsEqual(prevEffect.deps, deps);
  }

  console.log(deps, shouldRunEffect);

  // Limpiar efecto anterior si es necesario
  if (prevEffect && prevEffect.cleanup && shouldRunEffect) {
    try {
      prevEffect.cleanup();
    } catch (error) {
      console.error("Error in useEffect cleanup:", error);
    }
  }

  // Guardar el efecto actual
  componentState.effects[hookIndex] = {
    effect,
    deps: deps ? [...deps] : deps,
    cleanup: null,
  };

  // Ejecutar el efecto si es necesario
  if (shouldRunEffect) {
    setTimeout(() => {
      try {
        if (componentState.effects[hookIndex]) {
          const cleanup = effect();
          if (typeof cleanup === "function") {
            componentState.effects[hookIndex].cleanup = cleanup;
          }
        }
      } catch (error) {
        console.error("Error in useEffect:", error);
      }
    }, 0);
  }

  componentState.hookIndex++;
};

// Limpiar efectos de un componente
export const cleanupComponentEffects = (componentId) => {
  const componentState = componentStates.get(componentId);
  if (!componentState || !componentState.effects) return;

  componentState.effects.forEach((effectData) => {
    if (effectData && effectData.cleanup) {
      try {
        effectData.cleanup();
      } catch (error) {
        console.error("Error in component cleanup:", error);
      }
    }
  });

  componentStates.delete(componentId);
};

// Reset global para render completo
export const resetGlobalState = () => {
  componentStack = [];
  renderDepth = 0;
  globalComponentId = 0;
  // No limpiar componentStates para mantener el estado entre renders
};

// Debug helper
export const debugStates = () => {
  console.log("Component Stack:", componentStack);
  console.log("Component States:", Array.from(componentStates.entries()));
};
