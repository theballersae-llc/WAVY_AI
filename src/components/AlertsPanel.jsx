// src/components/AlertsPanel.jsx
import React, { useEffect, useState } from "react";
import { Api } from "../api";

export default function AlertsPanel() {
  const [alerts, setAlerts] = useState([]);

  async function refresh() {
    try {
      const { alerts } = await Api.alerts();
      setAlerts(alerts || []);
    } catch {
      setAlerts([]);
    }
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <div>
      <h3>Market Alerts</h3>
      <ul>
        {alerts.map((a, i) => (
          <li key={i}>
            <b>{a.title}</b> — {a.note}
          </li>
        ))}
      </ul>
    </div>
  );
}
