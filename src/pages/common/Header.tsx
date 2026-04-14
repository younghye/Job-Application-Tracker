import { NavLink, Outlet } from "react-router-dom";
import "../../assets/styles/index.css";

const Header = () => {
  return (
    <div className="w-full min-h-screen bg-gray-50">
      {/* <div className="max-w-7xl mx-auto p-8"> */}
      <div className="max-w-full mx-auto p-4 md:p-8 lg:p-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b pb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              🚀 Job Application Tracker
            </h1>
          </div>

          {/* NAVIGATION BUTTONS */}
          <nav className="flex  p-1 rounded-xl">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `px-6 py-1 text-base font-medium  ${
                  isActive
                    ? " text-blue-600 "
                    : "text-slate-600 hover:text-slate-900"
                }`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/applications"
              className={({ isActive }) =>
                `px-6 py-1 text-base font-medium  ${
                  isActive
                    ? "text-blue-600"
                    : "text-slate-600 hover:text-slate-900"
                }`
              }
            >
              Application List
            </NavLink>
          </nav>
        </header>

        <main className="bg-white rounded-2xl shadow-sm p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Header;
