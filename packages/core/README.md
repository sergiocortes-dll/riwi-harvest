# @harvest/core

A lightweight, experimental UI rendering and state management library inspired by React. It provides a minimal `createElement`, `render`, and hook system (`useState`) to build interactive user interfaces without external dependencies.

## Features

1. **JSX-compatible element creation**
   Implements a `createElement` function (aliased as `h`) to support JSX-like syntax.

2. **Functional components**
   Supports rendering components as pure functions.

3. **State management with hooks**
   Provides a simple `useState` hook for managing local component state.

4. **Re-render mechanism**
   Includes an internal re-render system triggered when state changes.

5. **Fragment support**
   Render multiple children without extra DOM wrappers using `Fragment`.

6. **DOM handling**
   Converts props into DOM attributes, styles, and event listeners.

---

## Installation

Since this package is part of a monorepo and not published to npm, you should import it directly from the local workspace. For example, if you are using **pnpm workspaces** or **yarn workspaces**:

```bash
# With pnpm
pnpm add @harvest/core --filter your-app

# With yarn
yarn workspace your-app add @harvest/core
```

Or import it using a relative path if not using a workspace setup:

```js
import { h, render, Fragment, useState } from "../../packages/@harvest/core";
```

---

## Usage Example

```js
import { h, render, Fragment, useState } from "@harvest/core";

const Counter = () => {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
};

const App = () => (
  <Fragment>
    <h1>Hello Harvest</h1>
    <Counter />
  </Fragment>
);

render(App, document.getElementById("root"));
```

---

## API Reference

### `createElement(type, props, ...children)` / `h`

Creates DOM elements or calls functional components.

### `render(component, rootElement)`

Mounts a component into a DOM root element and enables re-rendering.

### `Fragment`

Special component to group multiple children without extra DOM wrappers.

### `useState(initialValue)`

Hook for managing state inside components.

### `debugStates()`

Logs and returns the current state of all components for debugging.

---

## Limitations

* Only supports a subset of React-like functionality.
* No diffing algorithm (re-renders replace the DOM content).
* Hooks are limited to `useState`.

---

## License

MIT License
