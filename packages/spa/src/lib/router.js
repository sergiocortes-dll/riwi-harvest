// router.js - Router en vanilla JS, fusionado con Didact

// Contenedor global (de index.html)
const appContainer = document.getElementById('root');

// Rutas: array de objetos { path, component } - component es una función que retorna un elemento Didact
let routes = [];

// Función para agregar rutas (como <Route> en react-router)
function addRoute(path, component) {
    routes.push({ path, component });
}

// Encontrar ruta matching
function matchRoute(url) {
    return routes.find(route => route.path === url) || null;
}

// Cargar ruta: limpia contenedor y renderiza componente con Didact
function loadRoute(url) {
    const matched = matchRoute(url);
    if (matched) {
        // Limpia el contenedor anterior
        while (appContainer.firstChild) {
        appContainer.removeChild(appContainer.firstChild);
        }
        // Renderiza el nuevo componente usando Didact.render
        Didact.render(matched.component(), appContainer);
    } else {
        appContainer.innerHTML = '<h1>404 - Página no encontrada</h1>';
    }
}

// Manejar navegación: previene default, pushState, carga ruta
function navigate(event) {
    event.preventDefault();
    const path = event.target.getAttribute('href');
    window.history.pushState({}, '', path);
    loadRoute(path);
}

// Inicial: carga ruta actual al load
window.addEventListener('DOMContentLoaded', () => {
    loadRoute(window.location.pathname);
});

// Maneja back/forward
window.addEventListener('popstate', () => {
    loadRoute(window.location.pathname);
});

// Exportar para usar en index.js
const router = { addRoute, navigate };