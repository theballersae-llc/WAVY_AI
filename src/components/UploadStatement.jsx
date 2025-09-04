// src/components/UploadStatement.jsx
import React, { useState } from "react";
import { Api } from "../api";

export default function UploadStatement() {
  const [file, setFile] = useState(null);
  const [msg, setMsg] = useState("");

  const upload = async () => {
    if (!file) {
      setMsg("Select a file first");
      return;
    }
    try {
      const res = await Api.upload(file);
      setMsg(res.ok ? `Uploaded: ${res.key}` : `Upload failed: ${res.error}`);
    } catch (e) {
      setMsg(`Upload error: ${e.message}`);
    }
  };

  return (
    <div>
      <h3>Upload Statement</h3>
      <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
      <button onClick={upload}>Upload</button>
      {msg && <p>{msg}</p>}
    </div>
  );
}
