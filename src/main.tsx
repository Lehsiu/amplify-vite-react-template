import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Amplify } from "aws-amplify";


const outputs = {
  aws_project_region: "us-west-2",
  // 其他必要的 AWS 設定
};

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