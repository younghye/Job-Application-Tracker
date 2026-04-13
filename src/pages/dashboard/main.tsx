import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom"; // Change this
import ApplicationList from "../applications/ApplicationList";
import Dashboard from "./Dashboard";
import Header from "../common/Header";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<Header />}>
          <Route index element={<Dashboard />} /> {/* Default page */}
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="applications" element={<ApplicationList />} />
        </Route>
      </Routes>
    </HashRouter>
  </StrictMode>,
);
