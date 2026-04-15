import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Sidepanel from "./Sidepanel";
import "../../assets/styles/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Sidepanel />
  </StrictMode>,
);
