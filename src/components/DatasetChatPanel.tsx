import React, { useState, useRef } from "react";
import { DatasetChat, ChatMessage } from "@/types/dataset";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useChatMessages } from "@/hooks/useChatMessages";

const DatasetChatPanel = ({
  datasetId,
  chatId,
}: {
  datasetId: string;
  chatId?: string | null;
}) => {
  const { user } = useAuth();
  const {
    messages,
    sendMessage,
    isLoading: messagesLoading,
    sending,
  } = useChatMessages(chatId);

  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Profile initials fallback
  const getUserInitials = () => {
    if (!user) return "?";
    if (user.user_metadata?.full_name) {
      return user.user_metadata.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase();
    }
    return user.email?.charAt(0).toUpperCase() || "U";
  };

  // Send a user message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !chatId || !user) return;
    await sendMessage({ role: "user", content: input, user_id: user.id });
    setInput("");
    inputRef.current?.focus();
  };

  // The chat title editing, chat delete, and chat session list has been refactored into Workspace sidebar

  return (
    <div className="flex flex-col h-full w-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-zinc-900 rounded p-3 mb-2">
        {messagesLoading ? (
          <Loader2 className="animate-spin w-6 h-6 m-auto text-zinc-600" />
        ) : !chatId ? (
          <div className="text-center text-zinc-400 mt-8 text-sm">Start or select a chat session to begin.</div>
        ) : (
          <div className="space-y-2">
            {messages?.map((msg: ChatMessage) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={
                    "rounded px-3 py-2 max-w-[70%] text-sm " +
                    (msg.role === "user"
                      ? "bg-[#10A37F] text-white"
                      : "bg-zinc-800 text-zinc-200")
                  }
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2">
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about this dataset..."
          disabled={!chatId || sending}
        />
        <Button type="submit" disabled={!chatId || !input.trim() || sending}>
          {sending ? <Loader2 className="animate-spin w-4 h-4" /> : "Send"}
        </Button>
      </form>
    </div>
  );
};

export default DatasetChatPanel;
