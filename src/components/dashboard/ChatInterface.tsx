// src/pages/ChatInterface.tsx
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

/** 
 * Increase/decrease these classes to control chat window height
 * Examples:
 *  - "h-72"  = 18rem
 *  - "h-80"  = 20rem
 *  - "max-h-[26rem] min-h-[16rem]" for responsive fixed range
 */
const CHAT_HEIGHT_CLASSES = "h-80"; // <- make taller/shorter here

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Keep a ref to auto-scroll the messages container
  const scrollRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    "How should I invest 2,000 AED this month?",
    "Low risk, 1-year goal — what allocation?",
    "What's trending this week and why?",
  ];

  // Auto-scroll to bottom when messages change or while loading
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // smooth scroll to bottom
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
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
    setIsLoading(true); // hide quick prompts while waiting

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
      setIsLoading(false); // show quick prompts again after response
    }
  };

  return (
    <Card className="relative bg-black/40 backdrop-blur-md border-white/20 shadow-xl">
      <GlowingEffect
        spread={40}
        glow={true}
        disabled={false}
        proximity={64}
        inactiveZone={0.01}
        borderWidth={2}
      />
      <CardHeader className="border-b border-white/20">
        <CardTitle className="flex items-center gap-2 text-white">
          <MessageSquare className="h-5 w-5 text-teal-400" />
          Ask your Advisor
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6">
        {/* Messages window (taller now) */}
        <div
          ref={scrollRef}
          className={`space-y-3 overflow-y-auto mb-4 rounded-md ${CHAT_HEIGHT_CLASSES}`}
        >
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${
                message.type === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.type === "user"
                    ? "bg-teal-600 text-white"
                    : "bg-white/10 text-white border border-white/20"
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>
              </div>
            </motion.div>
          ))}

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

        {/* Quick prompts: hide while loading, reappear when response arrives */}
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
        <div className="flex space-x-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about crypto investments..."
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage(inputValue)}
            disabled={isLoading}
            className="border-white/30 bg-white/10 text-white placeholder-white/50 focus:border-teal-400"
          />
          <Button
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
