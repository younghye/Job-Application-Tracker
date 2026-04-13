import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Sidepanel from "./Sidepanel";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Sidepanel />
  </StrictMode>,
);
