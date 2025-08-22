import { Outlet } from "@harvest/router";

export default function SedeLayout({ children }) {
  return (
    <div className="w-(--sidebar-width) bg-white border-r border-r-divider h-full">
      {children || <Outlet />}
    </div>
  );
}
