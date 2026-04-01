import "../assets/styles/index.css";
import { Outlet } from "react-router-dom";
const Header = () => {
  return (
    <>
      <div className="w-full p-[50px]">
        <header className="app-header">
          <h1>🚀 Job Application Dashboard</h1>
          <button
            type="button"
            className="btn-secondary"
            // onClick={handleDeleteAll}
          >
            Home
          </button>
        </header>
        <main>
          <Outlet />
        </main>
      </div>
    </>
  );
};
export default Header;
