
import React, { useState, useRef } from "react";
import { DatasetChat, ChatMessage } from "@/types/dataset";
import { useDatasetChats } from "@/hooks/useDatasetChats";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

// Props: datasetId
const DatasetChatPanel = ({ datasetId }: { datasetId: string }) => {
  const { user } = useAuth();
  const { chats, createChat, isLoading: chatsLoading } = useDatasetChats(datasetId);

  // Selected chat session
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  // Message handling for current chat
  const {
    messages,
    sendMessage,
    isLoading: messagesLoading,
    sending,
  } = useChatMessages(selectedChatId);

  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Start a new chat session
  const handleStartChat = async () => {
    if (!user) return;
    const chat = await createChat();
    setSelectedChatId(chat.id);
  };

  // Send a user message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedChatId || !user) return;
    await sendMessage({ role: "user", content: input, user_id: user.id });
    setInput("");
    inputRef.current?.focus();
    // [TODO: Integrate LLM backend and insert assistant reply after user message]
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Chat session selector */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-zinc-400">Chat sessions:</span>
        {chatsLoading ? (
          <Loader2 className="animate-spin w-4 h-4 text-zinc-400" />
        ) : (
          <>
            {chats?.length
              ? chats.map((chat: DatasetChat) => (
                  <Button
                    key={chat.id}
                    variant={chat.id === selectedChatId ? "default" : "secondary"}
                    size="sm"
                    onClick={() => setSelectedChatId(chat.id)}
                  >
                    {chat.title ? chat.title : "Untitled"}
                  </Button>
                ))
              : null}
            <Button size="sm" variant="outline" onClick={handleStartChat}>
              + New Chat
            </Button>
          </>
        )}
      </div>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto bg-zinc-900 rounded p-3 mb-2">
        {messagesLoading ? (
          <Loader2 className="animate-spin w-6 h-6 m-auto text-zinc-600" />
        ) : !selectedChatId ? (
          <div className="text-center text-zinc-400 mt-8 text-sm">Start or select a chat session to begin.</div>
        ) : (
          <div className="space-y-2">
            {messages?.map((msg: ChatMessage) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
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
          disabled={!selectedChatId || sending}
        />
        <Button type="submit" disabled={!selectedChatId || !input.trim() || sending}>
          {sending ? <Loader2 className="animate-spin w-4 h-4" /> : "Send"}
        </Button>
      </form>
    </div>
  );
};

export default DatasetChatPanel;
