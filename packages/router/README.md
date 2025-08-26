# @harvest/router

A lightweight, experimental client-side router designed to work with **@harvest/core**. It provides single-page application (SPA) navigation, dynamic route matching with parameters, nested routes with outlets, query parameter parsing, and basic authentication handling.

## Features

1. **SPA navigation**
   Intercepts link clicks and updates browser history without reloading the page.

2. **Dynamic route parameters**
   Supports `:id`, optional parameters (`:id?`), and wildcards (`:rest*`).

3. **Nested routes with `<Outlet />`**
   Compose parent and child routes seamlessly.

4. **Authentication protection**
   Mark routes as `protected` and redirect unauthenticated users.

5. **Query parameter support**
   Easily access search parameters with `useSearchParams()`.

6. **Hooks for routing state**

   * `useParams()` → get current route params.
   * `useSearchParams()` → get query string values.
   * `useLocation()` → access current path, search, hash, and state.

7. **Customizable fallback**
   Provide a `fallback` component for `404` handling.

---

## Installation

Since this package is part of a monorepo and not published to npm, you should import it directly from the local workspace. For example, if you are using **pnpm workspaces** or **yarn workspaces**:

```bash
# With pnpm
pnpm add @harvest/router --filter your-app

# With yarn
yarn workspace your-app add @harvest/router
```

Or import it using a relative path if not using a workspace setup:

```js
import { Router, Link } from "../../packages/@harvest/router";
```

---

## Usage Example

```js
import { h, render } from "@harvest/core";
import { Router, Link, Outlet, useParams } from "@harvest/router";

const Home = () => <h1>Home Page</h1>;

const User = ({ params }) => <h2>User ID: {params.id}</h2>;

const Dashboard = ({ children }) => (
  <div>
    <h1>Dashboard</h1>
    <Outlet />
    {children}
  </div>
);

const routes = [
  { path: "/", element: Home },
  {
    path: "/dashboard",
    element: Dashboard,
    children: [
      { path: ":id", element: User },
    ],
  },
];

const App = () => (
  <div>
    <nav>
      <Link to="/">Home</Link>
      <Link to="/dashboard/123">User 123</Link>
    </nav>
    <Router routes={routes} />
  </div>
);

render(App, document.getElementById("root"));
```

---

## API Reference

### Components

* **`<Router routes fallback />`**
  Main router component. Accepts an array of routes and an optional fallback.

* **`<Link to="/path">`**
  Navigation component for SPA routing.

* **`<Outlet />`**
  Placeholder for nested route content.

### Hooks

* **`useParams()`** → Returns route parameters.
* **`useSearchParams()`** → Returns query parameters.
* **`useLocation()`** → Returns the current location object.

### Utilities

* **`navigate(path, options)`** → Programmatically navigate.
* **`setAuthenticated(boolean)`** / **`getAuthenticated()`** → Control authentication state.
* **`setAuthRedirect(path)`** → Configure auth redirect path.
* **`getCurrentPath()`** → Returns the current path.

---

## Limitations

* No route transitions or animations.
* No lazy loading or code splitting.
* Authentication is basic and client-side only.

---

## License

MIT License