// src/components/AnalyticsPanel.jsx
import React, { useEffect, useState } from "react";
import { Api } from "../api";

export default function AnalyticsPanel() {
  const [stats, setStats] = useState({ chat: 0, upload: 0 });
  async function load() {
    try {
      const res = await Api.analytics();
      setStats(res);
    } catch (e) {
      setStats({ chat: 0, upload: 0 });
    }
  }
  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);
  return (
    <div>
      <h3>Usage Statistics</h3>
      <p>Chats: {stats.chat}</p>
      <p>Uploads: {stats.upload}</p>
    </div>
  );
}
