import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx"; // tutorial says "./App.jsx"; this TypeScript project uses App.tsx
import "./index.css";
import { Authenticator } from "@aws-amplify/ui-react";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Authenticator>
      <App />
    </Authenticator>
  </React.StrictMode>
);
