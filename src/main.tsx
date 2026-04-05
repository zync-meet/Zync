import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./bones/registry";

createRoot(document.getElementById("root")!).render(<App />);
