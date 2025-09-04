// src/components/ChatBox.jsx
import React, { useState } from "react";
import { Api } from "../api";
import { loadProfile } from "../profile";

export default function ChatBox() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sending, setSending] = useState(false);

  const sendQuestion = async () => {
    const profile = loadProfile();
    if (!profile || !profile.income) {
      alert("Please save your profile first.");
      return;
    }
    if (!question.trim()) {
      alert("Enter a question.");
      return;
    }
    setSending(true);
    try {
      const resp = await Api.chat({ message: question.trim(), profile });
      setAnswer(resp.answer);
    } catch (e) {
      setAnswer(`Error: ${e.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <h3>Ask your Advisor</h3>
      <textarea
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="Ask about crypto investments…"
        rows={3}
      />
      <button onClick={sendQuestion} disabled={sending}>
        {sending ? "Sending…" : "Send"}
      </button>
      {answer && <pre>{answer}</pre>}
    </div>
  );
}
