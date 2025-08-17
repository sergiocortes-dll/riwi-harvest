let currentPath = window.location.pathname;
let updateComponent;

/**
 * Hook para obtener la ruta actual.
 * @returns {string} La ruta actual.
 */
export const useLocation = () => {
  return currentPath;
};

/**
 * Hook para la navegación programática.
 * @returns {Function} Una función para navegar a una nueva ruta.
 */
export const useNavigate = () => {
  return (path) => {
    window.history.pushState({}, "", path);
    currentPath = path;
    updateComponent();
  };
};

/**
 * Componente que renderiza un componente según la ruta actual.
 * @param {object} props Propiedades del componente.
 * @param {string} props.path La ruta a la que debe coincidir.
 * @param {Function} props.component El componente a renderizar si la ruta coincide.
 */
export const Route = ({ path, component: Component }) => {
  if (currentPath === path) {
    return Component();
  }
  return null;
};

/**
 * Componente que envuelve la aplicación y gestiona las rutas.
 * @param {object} props Propiedades del componente.
 * @param {Array<any>} props.children Los componentes Route.
 */
export const Router = (props) => {
  const { children = [] } = props || {};
  // Guardamos una referencia para forzar el re-render.
  updateComponent = () => {}; // Esto debería usar un hook de re-render de react-core.
  // Por simplicidad, asumimos que Router es el componente raíz y se volverá a renderizar.
  return children;
};
