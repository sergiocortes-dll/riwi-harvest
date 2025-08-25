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
    <div className="p-4 h-full">
      <div className="w-full bg-white min-h-full rounded-1 border border-divider"></div>
    </div>
  );
}
