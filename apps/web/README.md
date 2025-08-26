# Web Application (apps/web)

This package is part of the monorepo and contains a React-based web application built with Vite and TailwindCSS.

## Features

* React application scaffolded with Vite
* TailwindCSS integration for styling
* Chart.js with datalabels plugin for data visualization
* Uses internal workspaces: `@harvest/core` and `@harvest/router`

## Scripts

* `npm run dev` — start the development server
* `npm run build` — build the application for production
* `npm run start` — serve the production build locally

## Dependencies

* **@harvest/core** — internal workspace package
* **@harvest/router** — internal workspace package
* **tailwindcss** — utility-first CSS framework
* **vite** — fast build tool and development server
* **chart.js** — charting library
* **chartjs-plugin-datalabels** — plugin for data labels in charts

## Project Structure

```
apps/web/
├── index.html
├── jsconfig.json
├── package.json
├── vite.config.mjs
├── src/
│   └── ... React components and pages
└── node_modules/
```

## Getting Started

1. Navigate to the project directory:

```bash
cd apps/web
```
2. Install dependencies:

```bash
npm install
```
3. Run in development mode:

```bash
npm run dev
```

## Build

To build the project for production:

```bash
npm run build
```

The output will be in the `dist/` directory.

## License

This project is licensed under the MIT License.
