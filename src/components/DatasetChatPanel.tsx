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
  const [deferDisplayAI, setDeferDisplayAI] = useState(false); // For turn-based UX
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiMessageContent, setAiMessageContent] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages, aiThinking, deferDisplayAI, aiMessageContent]);

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

  // Fetch a concise data profile from backend Edge Function
  async function getDataProfile(datasetId: string): Promise<string> {
    try {
      const res = await fetch("/functions/v1/get-dataset-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ dataset_id: datasetId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unknown data profile error");
      return data.data_profile;
    } catch (err: any) {
      // fallback if error, instead use "columns only" descriptor
      return `Columns: not available, error: ${err.message || err}`;
    }
  }

  // Only allow send if not thinking AND (no AI message is pending) AND it's the user's turn
  // Always allow the first message to be sent
  const isFirstMessage = !messages || messages.length === 0;
  const canSend =
    !!chatId &&
    !!input.trim() &&
    !sending &&
    !aiThinking &&
    !deferDisplayAI &&
    (isFirstMessage ||
      (messages &&
        messages.length > 0 &&
        messages[messages.length - 1].role === "assistant"));

  // The main handler for sending
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !chatId || !user || aiThinking || deferDisplayAI) return;
    setAIThinking(true);
    setAiError(null);
    setDeferDisplayAI(true);
    setAiMessageContent(null);
    try {
      // 1. Get the real data_profile for this dataset!
      const data_profile = await getDataProfile(datasetId);
      // 2. Ask backend (ai-chat) and let it handle the chained logic (saving both messages)
      await sendUserMessageWithAIReply({
        user_id: user.id,
        userContent: input,
        data_profile,
      });
      // UX: Insert a slight delay before allowing user input again and showing the AI message
      setTimeout(() => {
        setDeferDisplayAI(false);
        setAiMessageContent(null);
      }, 550); // brief pause for smoother UX (can tweak ms)
      setInput("");
      inputRef.current?.focus();
    } catch (err: any) {
      setAiError("There was an error fetching the AI's response.");
      setDeferDisplayAI(false);
    } finally {
      setAIThinking(false);
    }
  };

  // Find the latest AI message for turn-based deferred UX
  const latestAIContent = (() => {
    if (!messages?.length) return null;
    for (let i = messages.length - 1; i >= 0; --i) {
      if (messages[i].role === "assistant") return messages[i].content;
    }
    return null;
  })();

  return (
    <div className="flex flex-col h-full w-full max-h-full">
      {/* Messages */}
      <div className="flex-1 flex flex-col min-h-0">
        <ScrollArea
          className="flex-1 h-[350px] sm:h-[450px] md:h-[550px] lg:h-[650px] w-full bg-zinc-900 rounded-2xl p-3 mb-2 overflow-y-auto shadow-sm border border-zinc-800/70 transition-all"
          ref={scrollAreaRef}
        >
          <div className="flex flex-col gap-4 pb-2">
            {messagesLoading ? (
              <Loader2 className="animate-spin w-6 h-6 m-auto text-zinc-600" />
            ) : !chatId ? (
              <div className="text-center text-zinc-400 mt-8 text-sm">
                Start or select a chat session to begin.
              </div>
            ) : (
              <>
                {messages &&
                  messages.map((msg: ChatMessage, idx: number) => {
                    const isUser = msg.role === "user";
                    const isLastAI =
                      msg.role === "assistant" &&
                      msg.content === latestAIContent &&
                      idx === messages.length - 1;
                    if (
                      isLastAI &&
                      deferDisplayAI &&
                      !aiError
                    )
                      return null;
                    return (
                      <div
                        key={msg.id}
                        className={`flex w-full transition-all ${
                          isUser ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`relative max-w-[78%] px-5 py-3 rounded-[2rem] text-base whitespace-pre-line shadow-lg
                            ${
                              isUser
                                ? "bg-[#4d818a] text-white mr-1"
                                : "bg-zinc-800/90 text-zinc-100 border border-zinc-700/60 ml-1"
                            }
                            animate-fade-in
                          `}
                          style={{
                            borderRadius: "2.2rem",
                            boxShadow: isUser
                              ? "0 2px 14px 0 rgba(77,129,138,0.17)"
                              : "0 2px 14px 0 rgba(0,0,0,0.13)",
                          }}
                        >
                          {msg.content}
                        </div>
                      </div>
                    );
                  })}
                {(aiThinking || deferDisplayAI) && (
                  <div className="flex justify-start">
                    <div className="rounded-[2rem] px-5 py-3 max-w-[70%] text-base bg-zinc-800/95 text-zinc-100 flex items-center gap-2 animate-fade-in shadow-md border border-zinc-700/60">
                      <Loader2 className="animate-spin w-4 h-4" />
                      <span className="ml-1 font-medium">DEXA is replying...</span>
                    </div>
                  </div>
                )}
                {aiError && (
                  <div className="flex justify-start">
                    <div className="rounded-[2rem] px-5 py-3 max-w-[70%] text-base bg-red-800/95 text-red-100 flex items-center gap-2 animate-fade-in shadow-md border border-red-700/70">
                      {aiError}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </div>
      {/* Sticky Input */}
      <div className="sticky bottom-0 left-0 w-full z-40 bg-zinc-950/95 border-t border-zinc-800 pt-4 pb-3 px-0 shadow-2xl backdrop-blur">
        <form
          onSubmit={handleSend}
          className="flex gap-3"
          style={{ background: "transparent" }}
        >
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about this dataset..."
            disabled={false}
            className="rounded-full border-zinc-700 focus:border-[#4d818a] bg-zinc-900/90 px-4 py-2 text-base transition-shadow focus:ring-[#4d818a]/30 shadow-inner"
            autoFocus
          />
          <Button
            type="submit"
            disabled={!canSend}
            className="rounded-full px-6 py-2 bg-[#4d818a] text-white shadow-lg hover:bg-[#30636a] font-semibold transition-all"
          >
            {(aiThinking || deferDisplayAI)
              ? <Loader2 className="animate-spin w-4 h-4" />
              : "Send"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default DatasetChatPanel;
