import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { Api, ProfileStore, mergeProfileForChat } from "@/lib/api";

interface ChatMessage {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
}

/** chat window height */
const CHAT_HEIGHT_CLASSES = "h-80";

/** Minimal heuristic: consider it an "allocation" message if it references common assets or the word "allocation" */
function hasAllocation(text: string): boolean {
  const t = text.toLowerCase();
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

/** Try to infer an AED amount from the AI text. Returns NaN if none. */
function inferAEDAmount(text: string): number {
  // Matches: "2,000 AED", "AED 2,000", "2000 AED", "AED2000"
  const patterns = [
    /aed\s*([\d,]+(?:\.\d+)?)/i,
    /([\d,]+(?:\.\d+)?)\s*aed/i,
  ];
  for (const re of patterns) {
    const m = re.exec(text);
    if (m && m[1]) {
      const n = parseFloat(m[1].replace(/,/g, ""));
      if (!Number.isNaN(n) && n > 0) return n;
    }
  }
  return NaN;
}

export function ChatInterface({
  balanceAED,
  availableBudgetAED,
  onDemoInvest,
}: {
  /** Current wallet balance shown on the right (AED) */
  balanceAED: number;
  /** Current "Available for Investment" (AED) shown on the right panel */
  availableBudgetAED: number | null;
  /** Callback to subtract & refresh visually */
  onDemoInvest: (payload: {
    totalAED: number;
  }) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusByMsg, setStatusByMsg] = useState<Record<string, string>>({});
  const [disabledByMsg, setDisabledByMsg] = useState<Record<string, boolean>>({});

  const scrollRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    "How should I invest 2,000 AED this month?",
    "Low risk, 1-year goal — what allocation?",
    "What's trending this week and why?",
  ];

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    const profile = ProfileStore.load();
    if (!profile) {
      alert("Please submit your profile first.");
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: message,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const normalized = mergeProfileForChat(profile);
      const { answer } = await Api.chat({ message, profile: normalized });

      const aiMessage: ChatMessage = {
        id: `${Date.now() + 1}`,
        type: "ai",
        content: answer,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      const errMsg: ChatMessage = {
        id: `${Date.now() + 2}`,
        type: "ai",
        content: `Error: ${error?.message || "chat failed"}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvestClick = (msg: ChatMessage) => {
    // 1) Figure out how much to invest:
    //    Use amount from AI text if present, else entire Available for Investment, else fall back to Balance.
    const parsedAED = inferAEDAmount(msg.content);
    const avail = typeof availableBudgetAED === "number" ? availableBudgetAED : null;
    let amount = !Number.isNaN(parsedAED)
      ? parsedAED
      : (avail ?? balanceAED);

    // safety clamps
    amount = Math.max(0, Math.min(amount, balanceAED || 0, avail ?? Infinity));

    if (amount <= 0) {
      setStatusByMsg((m) => ({ ...m, [msg.id]: "No demo funds available." }));
      return;
    }

    onDemoInvest({ totalAED: Number(amount.toFixed(2)) });

    setStatusByMsg((m) => ({
      ...m,
      [msg.id]: `Invested successfully`,
    }));
    setDisabledByMsg((m) => ({ ...m, [msg.id]: true }));
  };

  return (
    <Card className="relative bg-black/40 backdrop-blur-md border-white/20 shadow-xl">
      {/* Ensure the glow layer never blocks clicks */}
      <div className="pointer-events-none">
        <GlowingEffect
          spread={40}
          glow
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
          borderWidth={2}
        />
      </div>

      <CardHeader className="border-b border-white/20">
        <CardTitle className="flex items-center gap-2 text-white">
          <MessageSquare className="h-5 w-5 text-teal-400" />
          Ask your Advisor
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6 relative z-10">
        {/* Messages */}
        <div
          ref={scrollRef}
          className={`space-y-3 overflow-y-auto mb-4 rounded-md ${CHAT_HEIGHT_CLASSES}`}
        >
          {messages.map((message) => {
            const status = statusByMsg[message.id];
            const disabled = !!disabledByMsg[message.id];
            const showInvest =
              message.type === "ai" && hasAllocation(message.content);

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${
                  message.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg relative z-20 pointer-events-auto ${
                    message.type === "user"
                      ? "bg-teal-600 text-white"
                      : "bg-white/10 text-white border border-white/20"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>

                  {/* Show button only when the AI reply looks like an allocation */}
                  {showInvest && (
                    <div className="mt-2 relative z-20 pointer-events-auto">
                      <Button
                        type="button"
                        onClick={() => handleInvestClick(message)}
                        disabled={disabled}
                        className="bg-teal-600/90 hover:bg-teal-500 disabled:opacity-60 disabled:cursor-not-allowed text-white border border-teal-400/50
                                   shadow-[0_0_10px_rgba(45,212,191,0.45)]
                                   hover:shadow-[0_0_18px_rgba(45,212,191,0.9)]
                                   transition-all duration-200"
                      >
                        Invest Now
                      </Button>
                      {status && (
                        <span className="ml-3 text-xs text-teal-300/90">
                          {status}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}

          {/* Typing indicator */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                key="typing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex justify-start"
              >
                <div className="bg-white/10 p-3 rounded-lg border border-white/20">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-white/70 rounded-full animate-bounce" />
                    <div
                      className="w-2 h-2 bg-white/70 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    />
                    <div
                      className="w-2 h-2 bg-white/70 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quick prompts */}
        <AnimatePresence>
          {!isLoading && (
            <motion.div
              key="quick-prompts"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="space-y-2 mb-4"
            >
              {quickPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => handleSendMessage(prompt)}
                  className="w-full text-left p-2 text-xs bg-white/10 hover:bg-white/20 rounded-md transition-colors text-white/80 border border-white/10"
                >
                  {prompt}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input row */}
        <div className="flex space-x-2 relative z-20 pointer-events-auto">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about crypto investments..."
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage(inputValue)}
            disabled={isLoading}
            className="border-white/30 bg-white/10 text-white placeholder-white/50 focus:border-teal-400"
          />
          <Button
            type="button"
            onClick={() => handleSendMessage(inputValue)}
            disabled={isLoading || !inputValue.trim()}
            size="icon"
            className="bg-teal-600 hover:bg-teal-700"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
