/** @jsx h */
import ButtonIcon from "@/components/ui/button-icon";
import routeNames from "@/lib/routes.json";

export default function Header() {
  return (
    <header className="flex py-2 items-center bg-white border-b border-b-divider">
      <div className="flex items-center w-(--sidebar-width) px-4">
        <ButtonIcon label="Menú">
          <i class="fa-solid fa-bars"></i>
        </ButtonIcon>
        <img
          src="https://riwi.io/wp-content/uploads/2023/07/Fondo-claro-logo2-1.png"
          alt="Riwi"
          className="h-8"
        />
      </div>
      <div className="flex gap-2 flex-1">
        <h2 className="text-xl font-semibold">
          {routeNames[window.location.pathname]}
        </h2>
      </div>
    </header>
  );
}
