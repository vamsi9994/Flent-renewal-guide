import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";
import SubscriptionView from "@/SubscriptionView";
import SavingsView from "@/SavingsView";

// Check URL for view type
const params = new URLSearchParams(window.location.search);
const view = params.get('view');

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    {view === 'plans' ? <SubscriptionView /> : view === 'savings' ? <SavingsView /> : <App />}
  </React.StrictMode>,
);
