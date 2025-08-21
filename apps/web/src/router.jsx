import { createElement } from "@harvest/core";
import { Router } from "@harvest/router";
import Home from "./page/Home";
import Layout from "./page/Layout";

const routes = [
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "/",
        element: <Home />,
      },
    ],
  },
];

const AppRouter = () => createElement(Router, { routes });

export default AppRouter;
