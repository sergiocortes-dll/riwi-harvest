/** @jsx h */
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import { Outlet } from "@harvest/router";

const Layout = ({ children }) => {
  console.log("Layout renderizado, children:", children);

  return (
    <div className="w-[100dvw] h-[100dvh] flex flex-col">
      <Header />
      <div className="flex h-full">
        <Sidebar />
        <main className="main-content">{children || <Outlet />}</main>
      </div>
    </div>
  );
};

export default Layout;
