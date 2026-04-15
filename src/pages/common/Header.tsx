import { NavLink, Outlet } from "react-router-dom";
import "../../assets/styles/index.css";

const Header = () => {
  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <div className="flex-1 flex flex-col p-6 md:p-10 overflow-hidden">
        <header className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 border-b pb-6 shrink-0">
          <h1 className="text-2xl font-bold text-slate-900">
            🚀 Job Application Tracker
          </h1>

          <nav className="flex gap-2">
            {[
              { to: "/dashboard", label: "Dashboard" },
              { to: "/applications", label: "Application List" },
            ].map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `px-4 py-1 text-sm font-medium transition-colors ${
                    isActive
                      ? "text-blue-600"
                      : "text-slate-500 hover:text-slate-900"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </header>

        <main className="flex-1 bg-white rounded-2xl shadow-sm p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Header;
