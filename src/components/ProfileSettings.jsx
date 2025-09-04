// src/components/ProfileSettings.jsx
import React, { useState } from "react";
import { Api, RISK_MAP } from "../api";
import { saveProfile } from "../profile";

export default function ProfileSettings({ onReady }) {
  const [income, setIncome] = useState(8000);
  const [expenses, setExpenses] = useState(4000);
  const [goal, setGoal] = useState("Long-term wealth building");
  const [horizon, setHorizon] = useState(5);
  const [riskLabel, setRiskLabel] = useState("Moderate");
  const [saving, setSaving] = useState(false);
  const [riskScore, setRiskScore] = useState(null);

  const handleEnter = async () => {
    setSaving(true);
    const selfRisk = RISK_MAP[riskLabel] ?? 0.5;
    try {
      const { risk_score } = await Api.risk({
        income,
        expenses,
        horizon_years: horizon,
        self_risk: selfRisk,
      });
      setRiskScore(risk_score);
      const profile = {
        income,
        expenses,
        goal,
        horizon_years: horizon,
        risk_label: riskLabel,
        self_risk: selfRisk,
        risk_score,
      };
      saveProfile(profile);
      if (onReady) onReady(profile);
      alert(`Profile saved. Risk score: ${risk_score}`);
    } catch (e) {
      alert(`Risk API error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2>Profile Settings</h2>
      <div>
        <label>Monthly Income (AED)</label>
        <input
          type="number"
          value={income}
          onChange={(e) => setIncome(+e.target.value)}
        />
      </div>
      <div>
        <label>Monthly Expenses (AED)</label>
        <input
          type="number"
          value={expenses}
          onChange={(e) => setExpenses(+e.target.value)}
        />
      </div>
      <div>
        <label>Investment Goal</label>
        <input
          type="text"
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
        />
      </div>
      <div>
        <label>Time Horizon (years)</label>
        <input
          type="number"
          value={horizon}
          onChange={(e) => setHorizon(+e.target.value)}
        />
      </div>
      <div>
        <label>Risk Tolerance</label>
        <select
          value={riskLabel}
          onChange={(e) => setRiskLabel(e.target.value)}
        >
          <option>Conservative</option>
          <option>Moderate</option>
          <option>Aggressive</option>
        </select>
      </div>
      <button onClick={handleEnter} disabled={saving}>
        {saving ? "Saving…" : "Enter"}
      </button>
      {riskScore !== null && <p>Risk Score: {riskScore}</p>}
    </div>
  );
}
