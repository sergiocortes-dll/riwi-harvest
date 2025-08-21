/** @jsx h */
import ButtonIcon from "@/components/ui/button-icon";
import { Link } from "@harvest/router";
import Select from "../ui/select";

// Objeto observable simple
const locationState = {
  value: "med",
  listeners: [],

  set(newValue) {
    this.value = newValue;
    this.listeners.forEach((listener) => listener(newValue));
  },

  subscribe(listener) {
    this.listeners.push(listener);
  },
};

export default function Header() {
  const locations = [
    { value: "med", label: "Medellín" },
    { value: "barr", label: "Barranquilla" },
  ];

  const handleSelect = (e) => {
    locationState.set(e);

    // Actualizar el display directamente
    const displays = document.querySelectorAll("[data-current-location]");
    displays.forEach((display) => {
      display.textContent = e;
    });
  };

  return (
    <header className="flex p-2 items-center bg-white border-b border-b-divider">
      <div className="flex items-center w-(--sidebar-width)">
        <ButtonIcon label="text">
          <i class="fa-solid fa-bars"></i>
        </ButtonIcon>
        <img
          src="https://riwi.io/wp-content/uploads/2023/07/Fondo-claro-logo2-1.png"
          alt="Riwi"
          className="h-8"
        />
      </div>
      <div className="flex-1">
        <Select
          value={locationState.value}
          onChange={handleSelect}
          options={locations}
          icon={<i class="fa-solid fa-caret-down"></i>}
        />
        <Link to="/test">Test</Link>
        <Link to="/hola">Hola</Link>
      </div>
      <span data-current-location>{locationState.value}</span>
    </header>
  );
}
