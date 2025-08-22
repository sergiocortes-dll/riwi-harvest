import Button from "@/components/ui/button";
import { Link } from "@harvest/router";
import Divider from "../ui/divider";

export default function Sidebar() {
  return (
    <div className="sticky top-14 h-[calc(100dvh-(var(--spacing)*15))] inline-flex flex-col gap-2 w-(--sidebar-width) bg-white border-r border-r-divider p-2">
      <Button
        align="left"
        fullWidth
        active
        asChild
        icon={<i class="fa-solid fa-house"></i>}
        component={Link}
        to="/"
      >
        Dashboard
      </Button>
      <Button
        align="left"
        fullWidth
        icon={<i class="fa-solid fa-users"></i>}
        component={Link}
        to="/clanes"
      >
        Clanes
      </Button>
      <Button
        align="left"
        fullWidth
        icon={<i class="fa-solid fa-code"></i>}
        component={Link}
        to="/coder"
      >
        Coder
      </Button>
      <Button
        align="left"
        fullWidth
        icon={<i class="fa-solid fa-gear"></i>}
        component={Link}
        to="/desarrollo"
      >
        Desarrollo
      </Button>
      <Button
        align="left"
        fullWidth
        icon={<i class="fa-solid fa-people-group"></i>}
        component={Link}
        to="/usuarios"
      >
        Versus
      </Button>
      <Divider margin="none" />
      <div className="flex flex-col gap-2">
        <h2>Sedes</h2>
        <Link
          to="/sede/med"
          className="flex transition-colors p-1 items-center gap-2 hover:bg-gray-100 rounded-1 overflow-hidden border border-divider"
        >
          <img
            className="w-5/12 rounded-2 aspect-video"
            src="https://moodle.riwi.io/pluginfile.php/7355/course/overviewfiles/Be%20a%20coder%20fox%20orange.png"
          />
          <span className="flex-1">Medellín</span>
        </Link>
        <Link
          to="/sede/barr"
          className="flex transition-colors p-1 items-center gap-2 hover:bg-gray-100 rounded-1 overflow-hidden border border-divider"
        >
          <img
            className="w-5/12 rounded-2 aspect-video"
            src="https://moodle.riwi.io/pluginfile.php/6284/course/overviewfiles/portada_RB-DLLO.png"
          />
          <span className="flex-1">Barranquilla</span>
        </Link>
      </div>
    </div>
  );
}
