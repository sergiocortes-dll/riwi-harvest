import { ChartComponent } from "@/components/ui/chart";

const ClanChart = () => {
  return (
    <ChartComponent
      type="bar"
      data={{
        labels: [
          "Caimán",
          "Ciénaga",
          "Macondo",
          "Manglar",
          "Sierra",
          "Tayrona",
        ],
        datasets: [
          {
            label: "Desempeño",
            data: [79.82, 83.68, 81.58, 82.18, 80.39, 80.17],
            borderColor: "#6b5cff",
            backgroundColor: "#6b5cff",
            barThickness: 30,
          },
        ],
      }}
      options={{
        responsive: true,
        layout: {},
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              padding: 20, // más espacio entre título y leyenda
            },
          },
          title: {
            display: true,
            text: "Desempeño general de los clanes",
            padding: { bottom: 30 },
          },
        },
      }}
    />
  );
};

export default function Clanes() {
  return (
    <div>
      Clanes
      <div className="max-w-2xl">
        <ClanChart />
      </div>
    </div>
  );
}
