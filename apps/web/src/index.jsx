import { render } from "@harvest/core";
import { setRouterReRender } from "../../../packages/router/src";
import "./app/globals.css";
import AppRouter from "./router";

console.log("Iniciando aplicación...");
setRouterReRender(() => {
  render(AppRouter, document.getElementById("root"));
});

render(AppRouter, document.getElementById("root"));
