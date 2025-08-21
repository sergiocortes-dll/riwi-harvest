/** @jsx h */
import Header from "@/components/layout/header";
import { Outlet } from "@harvest/router";

const Layout = ({ children }) => {
  console.log("Layout renderizado, children:", children);

  return (
    <div className="app-layout">
      <Header />
      <main className="main-content">{children || <Outlet />}</main>
    </div>
  );
};

export default Layout;
