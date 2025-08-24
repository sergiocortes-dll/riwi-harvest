import Button from "@/components/ui/button";
import { Link, useLocation } from "@harvest/router";
import Divider from "../ui/divider";

const routes = [
  {
    name: "Dashboard",
    to: "/",
    icon: "fa-solid fa-house",
    component: Link,
  },
  {
    name: "Clanes",
    to: "/clanes",
    icon: "fa-solid fa-users",
    component: Link,
  },
  {
    name: "Coders",
    to: "/coders",
    icon: "fa-solid fa-code",
    component: Link,
  },
  {
    name: "Desarrollo",
    to: "/desarrollo",
    icon: "fa-solid fa-gear",
    component: Link,
  },
  {
    name: "Versus",
    to: "/usuarios",
    icon: "fa-solid fa-people-group",
    component: Link,
  },
];

export default function Sidebar() {
  const active = useLocation().pathname;
  return (
    <div className="sticky top-14 h-[calc(100dvh-(var(--spacing)*15))] inline-flex flex-col gap-2 w-(--sidebar-width) bg-white border-r border-r-divider p-2">
      <div className="flex flex-1 flex-col gap-2">
        {routes.map((route) => (
          <Button
            key={route.to}
            align="left"
            fullWidth
            active={active === route.to}
            asChild
            icon={<i class={route.icon}></i>}
            component={route.component}
            to={route.to}
          >
            {route.name}
          </Button>
        ))}
        <Divider margin="none" />
        <Button
          align="left"
          fullWidth
          icon={<i class="fa-solid fa-arrow-right-arrow-left"></i>}
          component={Link}
          to="/sede"
        >
          Cambiar sede
        </Button>
      </div>
      <Button className="sticky bottom-0" variant="outline">
        Usuario
      </Button>
    </div>
  );
}
