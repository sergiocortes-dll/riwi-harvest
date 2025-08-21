import ButtonIcon from "@/components/ui/button-icon";

export default function Header() {
  return (
    <header className="flex p-2 items-center bg-white border-b border-b-divider">
      <ButtonIcon>
        <i class="fa-solid fa-bars"></i>
      </ButtonIcon>
      <img
        src="https://riwi.io/wp-content/uploads/2023/07/Fondo-claro-logo2-1.png"
        alt="Riwi"
        className="h-8"
      />
    </header>
  );
}
