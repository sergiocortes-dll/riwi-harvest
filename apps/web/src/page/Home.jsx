import Button from "@/components/ui/button";
import TreeView from "@/components/ui/tree-view";

const data = [
  {
    label: "src",
    children: [
      {
        label: "components",
        children: [
          {
            label: "Button.jsx",
          },
          {
            label: "Header.jsx",
          },
        ],
      },
    ],
  },
];

export default function Home() {
  return (
    <div>
      <h1 class="text-3xl font-bold underline">Hello world!</h1>
      <TreeView data={data} />
      <div className="flex min-h-svh flex-col items-center justify-center">
        <Button
          variant="primary"
          size="large"
          onClick={() => console.log("Clicked!")}
          icon={<i class="fa-solid fa-house"></i>}
        >
          Hola mundo
        </Button>
      </div>
    </div>
  );
}
