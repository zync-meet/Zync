import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./bones/registry";
import { registerSW } from "virtual:pwa-register";

registerSW({ immediate: true });

createRoot(document.getElementById("root")!).render(<App />);
