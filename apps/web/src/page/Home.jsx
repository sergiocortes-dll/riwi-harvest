import Button from "@/components/ui/button";

export default function Home() {
  return (
    <div>
      <h1 class="text-3xl font-bold underline">Hello world!</h1>
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
