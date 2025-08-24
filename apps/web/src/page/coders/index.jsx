import { ChartComponent } from "@/components/ui/chart";

const sections = [
  {
    title: "Desarrollo de Software",
    charts: [
      {
        type: "bar",
        title: "Fundamentos de programación con Python",
        labels: ["Rendimiento Formativo", "Dominio"],
        data: [98.37, 96],
      },
      {
        type: "bar",
        title: "HTML y CSS",
        labels: ["Rendimiento Formativo", "Dominio"],
        data: [83.02, 76],
      },
    ],
  },
  {
    title: "English",
    charts: [
      {
        type: "bar",
        title: "English 101",
        labels: ["Rendimiento Formativo", "Dominio"],
        data: [90.67, 69],
      },
      {
        type: "bar",
        title: "Building blocks",
        labels: ["Rendimiento Formativo", "Dominio"],
        data: [82.81, 86.75],
      },
    ],
  },
  {
    title: "Habilidades para la vida",
    charts: [
      {
        type: "pie",
        title: "Módulo 1: Cultura Riwi",
        labels: ["Alcanzado", "Faltante"],
        data: [95, 5],
      },
      {
        type: "pie",
        title: "Módulo 2: Vivamos los valores Riwi",
        labels: ["Alcanzado", "Faltante"],
        data: [86, 14],
      },
    ],
  },
];

export default function Coders() {
  return (
    <div className="space-y-20 p-10">
      {sections.map((section, i) => (
        <div key={i} className="space-y-6">
          <h2 className="text-xl font-bold uppercase">{section.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {section.charts.map((chart, j) => (
              <div
                className="min-h-[50dvh] bg-white p-5 border border-divider rounded-1"
                key={j}
              >
                <ChartComponent
                  type={chart.type}
                  className="max-w-md"
                  data={{
                    labels: chart.labels,
                    datasets: [
                      {
                        label: chart.title,
                        data: chart.data,
                        backgroundColor:
                          chart.type === "pie"
                            ? ["#5acca4", "#E97132"]
                            : "#6b5cff",
                        borderColor: "#eee",
                        barThickness: chart.type === "bar" ? 40 : undefined,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "bottom",
                      },
                      datalabels: {
                        formatter: (value, context) => {
                          if (context.chart.config.type === "pie") {
                            return value + "%";
                          }
                        },
                      },
                      title: {
                        display: true,
                        text: chart.title,
                        padding: {
                          bottom: 30,
                        },
                        font: {
                          size: 20,
                        },
                      },
                    },
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
