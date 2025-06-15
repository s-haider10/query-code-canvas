
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
    isLoading: messagesLoading,
    sending,
    sendUserMessageWithAIReply,
  } = useChatMessages(chatId);

  const [input, setInput] = useState("");
  const [aiThinking, setAIThinking] = useState(false);
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

  // Fake data profile for now (if needed); in a real scenario fetch/send real profile
  const generateFakeDataProfile = () => "Columns: [ID, Name, Age], ...";

  // Send a user message + AI reply
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !chatId || !user) return;
    setAIThinking(true);
    // data_profile logic here (replace with actual implementation if needed)
    const data_profile = generateFakeDataProfile();
    await sendUserMessageWithAIReply({
      user_id: user.id,
      userContent: input,
      data_profile,
    });
    setInput("");
    setAIThinking(false);
    inputRef.current?.focus();
  };

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
            {/* Show UI feedback while waiting for AI's reply */}
            {aiThinking && (
              <div className="flex justify-start">
                <div className="rounded px-3 py-2 max-w-[70%] text-sm bg-zinc-800 text-zinc-200 flex items-center gap-2">
                  <Loader2 className="animate-spin w-4 h-4" /> AI is thinking...
                </div>
              </div>
            )}
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
          disabled={!chatId || sending || aiThinking}
        />
        <Button type="submit" disabled={!chatId || !input.trim() || sending || aiThinking}>
          {(sending || aiThinking) ? <Loader2 className="animate-spin w-4 h-4" /> : "Send"}
        </Button>
      </form>
    </div>
  );
};

export default DatasetChatPanel;
