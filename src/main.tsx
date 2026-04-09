import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// import { HashRouter, Routes, Route, Navigate } from "react-router-dom"; // Change this
// import ApplicationList from "./pages/applications/ApplicationList";
// import Header from "./pages/Header";
import Sidepanel from "./pages/Sidepanel";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Sidepanel />
  </StrictMode>,
  // <StrictMode>
  //   <HashRouter>
  //     <Routes>
  //       <Route path="/" element={<Header />}>
  //         {/* This tells React: If the path is exactly "/", show ApplicationList */}
  //         <Route index element={<ApplicationList />} />

  //         {/* This handles the /index.html case specifically if it bypasses the index */}
  //         <Route path="index.html" element={<Navigate to="/" replace />} />

  //         {/* <Route path="settings" element={<Settings />} /> */}
  //       </Route>
  //     </Routes>
  //   </HashRouter>
  // </StrictMode>,
);
