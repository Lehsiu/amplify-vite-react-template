import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Amplify } from "aws-amplify";
import outputs from "./amplify_outputs.json";

try {
  Amplify.configure(outputs);
} catch (e) {
  console.warn("amplify_outputs.json not found, skipping Amplify config");
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);