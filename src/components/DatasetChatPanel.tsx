
import React, { useState, useRef, useEffect } from "react";
import { DatasetChat, ChatMessage } from "@/types/dataset";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useChatMessages } from "@/hooks/useChatMessages";
import { ScrollArea } from "@/components/ui/scroll-area";

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

  // For auto-scroll
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      // Scroll to bottom on new message
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, aiThinking]);

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

  const generateFakeDataProfile = () => "Columns: [ID, Name, Age], ...";

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !chatId || !user) return;
    setAIThinking(true);
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
    <div className="flex flex-col h-full w-full max-h-full">
      {/* Messages */}
      <ScrollArea className="flex-1 h-[350px] sm:h-[450px] md:h-[550px] lg:h-[650px] w-full bg-zinc-900 rounded-2xl p-3 mb-2 overflow-y-auto shadow-sm border border-zinc-800/70 transition-all"
        ref={scrollAreaRef}
      >
        <div className="flex flex-col gap-4 pb-2">
          {messagesLoading ? (
            <Loader2 className="animate-spin w-6 h-6 m-auto text-zinc-600" />
          ) : !chatId ? (
            <div className="text-center text-zinc-400 mt-8 text-sm">Start or select a chat session to begin.</div>
          ) : (
            <>
              {messages?.map((msg: ChatMessage, idx: number) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={msg.id}
                    className={`flex w-full transition-all
                      ${isUser ? "justify-end" : "justify-start"}
                      `}
                  >
                    <div
                      className={`relative max-w-[80%] px-5 py-3 rounded-2xl text-base whitespace-pre-line
                        shadow-md
                        ${isUser
                          ? "bg-gradient-to-br from-[#13EF95] to-[#10A37F] text-white rounded-br-2xl rounded-tr-2xl rounded-tl-lg mr-1"
                          : "bg-zinc-800/95 text-zinc-100 border border-zinc-700/60 rounded-bl-2xl rounded-tr-2xl rounded-br-lg ml-1"}
                        animate-fade-in
                      `}
                      style={{
                        borderTopRightRadius: isUser ? "1.25rem" : "1.125rem",
                        borderTopLeftRadius: isUser ? "1.125rem" : "1.25rem",
                        boxShadow: isUser
                          ? "0 2px 12px 0 rgba(19,239,149,0.11)"
                          : "0 2px 12px 0 rgba(0,0,0,0.15)",
                        // mimic more ChatGPT styling
                      }}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              {/* Show UI feedback while waiting for AI's reply */}
              {aiThinking && (
                <div className="flex justify-start">
                  <div className="rounded-2xl px-5 py-3 max-w-[70%] text-base bg-zinc-800/95 text-zinc-100 flex items-center gap-2 animate-fade-in shadow-md border border-zinc-700/60">
                    <Loader2 className="animate-spin w-4 h-4" /> AI is thinking...
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>
      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex gap-3 mt-1 border-t border-zinc-800 pt-4"
        style={{ background: "transparent" }}
      >
        <Input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question about this dataset..."
          disabled={!chatId || sending || aiThinking}
          className="rounded-full border-zinc-700 focus:border-green-400 bg-zinc-950/90 px-4 py-2 text-base transition-shadow focus:ring-green-400/30 shadow-inner"
          autoFocus
        />
        <Button
          type="submit"
          disabled={!chatId || !input.trim() || sending || aiThinking}
          className="rounded-full px-6 py-2 bg-gradient-to-br from-[#13EF95] to-[#10A37F] text-white shadow-lg hover:from-[#10A37F] hover:to-[#20dab3] font-semibold transition-all"
        >
          {(sending || aiThinking) ? <Loader2 className="animate-spin w-4 h-4" /> : "Send"}
        </Button>
      </form>
    </div>
  );
};

export default DatasetChatPanel;

