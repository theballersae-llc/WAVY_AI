// src/components/pages/VoiceChat.tsx
import React, { useEffect, useRef, useState } from "react";
import { Mic, Square, Volume2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Api, ProfileStore, mergeProfileForChat } from "@/lib/api";

/** Heuristic: does the text look like it contains an allocation/portfolio advice? */
function hasAllocation(text: string): boolean {
  const t = (text || "").toLowerCase();
  const keywords = [
    "allocation",
    "allocate",
    "portfolio",
    "bitcoin",
    "btc",
    "ethereum",
    "eth",
    "stablecoin",
    "stablecoins",
    "usdc",
    "usdt",
    "dai",
  ];
  return keywords.some((k) => t.includes(k));
}

/** Try to infer AED amount from free text. Returns NaN if none. */
function inferAEDAmount(text: string): number {
  // Matches: "2,000 AED", "AED 2,000", "2000 AED", "AED2000"
  const patterns = [
    /aed\s*([\d,]+(?:\.\d+)?)/i,
    /([\d,]+(?:\.\d+)?)\s*aed/i,
  ];
  for (const re of patterns) {
    const m = re.exec(text || "");
    if (m && m[1]) {
      const n = parseFloat(m[1].replace(/,/g, ""));
      if (!Number.isNaN(n) && n > 0) return n;
    }
  }
  return NaN;
}

declare global {
  interface Window {
    webkitSpeechRecognition?: any;
    SpeechRecognition?: any;
  }
}

export function VoiceChat({
  /** Current wallet balance (AED) shown on the right panel */
  balanceAED,
  /** Current "Available for Investment" (AED) from the Allocation card */
  availableBudgetAED,
  /** Callback that reduces the "Total Balance (AED)" on the Dashboard */
  onDemoInvest,
}: {
  balanceAED: number;
  availableBudgetAED: number | null;
  onDemoInvest: (payload: { totalAED: number }) => void;
}) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiReply, setAiReply] = useState("");
  const [busy, setBusy] = useState(false);

  // Invest UI state (for the latest AI reply)
  const [investDisabled, setInvestDisabled] = useState(false);
  const [investStatus, setInvestStatus] = useState<string>("");

  const recogRef = useRef<any>(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      console.warn("SpeechRecognition not supported in this browser.");
      return;
    }
    const recog = new SR();
    recog.lang = "en-US";
    recog.interimResults = true;
    recog.continuous = true;

    recog.onresult = (e: any) => {
      let finalText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        finalText += e.results[i][0].transcript;
      }
      setTranscript(finalText.trim());
    };

    recog.onend = () => {
      setListening(false);
    };

    recogRef.current = recog;
  }, []);

  const startListening = async () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR || !recogRef.current) {
      alert("Voice not supported in this browser. Please use Chrome.");
      return;
    }
    setTranscript("");
    setAiReply("");
    setInvestDisabled(false);
    setInvestStatus("");
    setListening(true);
    try {
      await recogRef.current.start();
    } catch {
      // ignore double start errors
    }
  };

  const stopListening = async () => {
    try {
      recogRef.current?.stop();
    } catch {
      // ignore
    }
    setListening(false);
    if (transcript.trim()) {
      await askAgent(transcript.trim());
    }
  };

  const askAgent = async (text: string) => {
    setBusy(true);
    try {
      const profile = ProfileStore.load();
      if (!profile) {
        alert("Please submit your profile first.");
        return;
      }
      const normalized = mergeProfileForChat(profile);
      const { answer } = await Api.chat({ message: text, profile: normalized });
      setAiReply(answer);
      setInvestDisabled(false);
      setInvestStatus("");

      // Speak the answer
      speak(answer);
    } catch (e: any) {
      const msg = e?.message || "voice chat failed";
      setAiReply(`Error: ${msg}`);
      speak(`Error: ${msg}`);
    } finally {
      setBusy(false);
    }
  };

  const speak = (text: string) => {
    try {
      const utter = new SpeechSynthesisUtterance(text);
      utter.rate = 1.0;
      utter.pitch = 1.0;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utter);
    } catch {
      // ignore
    }
  };

  const handleInvestNow = () => {
    if (!aiReply) {
      setInvestStatus("No advice to action.");
      return;
    }
    // 1) Prefer explicit AED in AI text
    const parsed = inferAEDAmount(aiReply);

    // 2) Otherwise use Available for Investment, else Balance
    const avail = typeof availableBudgetAED === "number" ? availableBudgetAED : null;
    let amount = !Number.isNaN(parsed) ? parsed : (avail ?? balanceAED);

    // safety clamps
    amount = Math.max(0, Math.min(amount, balanceAED || 0, avail ?? Infinity));

    if (amount <= 0) {
      setInvestStatus("No demo funds available.");
      return;
    }

    onDemoInvest({ totalAED: Number(amount.toFixed(2)) });
    setInvestStatus("Invested successfully");
    setInvestDisabled(true);
  };

  const showInvest = hasAllocation(aiReply);

  return (
    <Card className="relative bg-black/40 backdrop-blur-md border-white/20 shadow-xl">
      <CardHeader className="border-b border-white/20">
        <CardTitle className="flex items-center gap-2 text-white">
          <Volume2 className="h-5 w-5 text-teal-400" />
          Talk to WAVY
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          {!listening ? (
            <Button
              onClick={startListening}
              disabled={busy}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              <Mic className="h-4 w-4 mr-2" />
              Start
            </Button>
          ) : (
            <Button onClick={stopListening} variant="destructive">
              <Square className="h-4 w-4 mr-2" />
              Stop
            </Button>
          )}
          <span className="text-white/70 text-sm">
            {listening ? "Listening…" : busy ? "Thinking…" : "Idle"}
          </span>
        </div>

        <div className="space-y-3">
          <div className="p-3 bg-white/10 rounded-lg border border-white/20 min-h-[56px]">
            <div className="text-xs text-white/60 mb-1">You said</div>
            <div className="text-sm text-white whitespace-pre-wrap">
              {transcript || "—"}
            </div>
          </div>

          <div className="p-3 bg-white/10 rounded-lg border border-white/20 min-h-[80px]">
            <div className="text-xs text-white/60 mb-1">Advisor</div>
            <div className="text-sm text-white whitespace-pre-wrap">{aiReply || "—"}</div>

            {/* Invest Now (same logic as text chat) */}
            {showInvest && (
              <div className="mt-3">
                <Button
                  type="button"
                  onClick={handleInvestNow}
                  disabled={investDisabled}
                  className="bg-teal-600/90 hover:bg-teal-500 disabled:opacity-60 disabled:cursor-not-allowed text-white border border-teal-400/50
                             shadow-[0_0_10px_rgba(45,212,191,0.45)]
                             hover:shadow-[0_0_18px_rgba(45,212,191,0.9)]
                             transition-all duration-200"
                >
                  Invest Now
                </Button>
                {investStatus && (
                  <span className="ml-3 text-xs text-teal-300/90">{investStatus}</span>
                )}
              </div>
            )}
          </div>
        </div>

        <p className="text-[11px] text-white/50 mt-3">
          Tip: Use Chrome. Allow microphone permission when prompted.
        </p>
      </CardContent>
    </Card>
  );
}
