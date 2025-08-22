import { createElement } from "@harvest/core";
import Chart from "chart.js/auto";
import ChartDataLabels from "chartjs-plugin-datalabels";

Chart.register(ChartDataLabels);

export function ChartComponent({ type = "line", data, options }) {
  const canvas = createElement("canvas", {});

  requestAnimationFrame(() => {
    if (canvas.isConnected) {
      new Chart(canvas.getContext("2d"), {
        type,
        data,
        options: {
          ...options,
          plugins: {
            ...options?.plugins,
            datalabels: {
              anchor: "end",
              align: "top",
              color: "#000",
              font: { weight: "bold" },
              formatter: (value) => value,
            },
          },
        },
      });
    }
  });

  return canvas;
}
