import Header from "@/components/layout/header";
import { Outlet } from "@harvest/router";

export default function Layout() {
  return (
    <div>
      <Header />
      <div>
        <Outlet />
      </div>
    </div>
  );
}
