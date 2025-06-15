
import React, { useState, useRef } from "react";
import { DatasetChat, ChatMessage } from "@/types/dataset";
import { useDatasetChats } from "@/hooks/useDatasetChats";
import { useChatMessages } from "@/hooks/useChatMessages";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Pencil, Trash2, Save, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

const DatasetChatPanel = ({ datasetId }: { datasetId: string }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Chat sessions & state
  const {
    chats = [],
    createChat,
    isLoading: chatsLoading,
    error: chatsError,
    creating,
    updateChatTitle,
    deleteChat
  } = useDatasetChats(datasetId, user?.id ?? null);

  // Selected chat session
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  // Title editing UI state
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [titleInputs, setTitleInputs] = useState<{ [id: string]: string }>({});

  // Message handling for current chat
  const {
    messages,
    sendMessage,
    isLoading: messagesLoading,
    sending,
  } = useChatMessages(selectedChatId);

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

  // Start a new chat session
  const handleStartChat = async () => {
    if (!user) return;
    const chat = await createChat(null);
    setSelectedChatId(chat.id);
  };

  // Send a user message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedChatId || !user) return;
    await sendMessage({ role: "user", content: input, user_id: user.id });
    setInput("");
    inputRef.current?.focus();
  };

  // Start editing chat title
  const startEditingTitle = (chat: DatasetChat) => {
    setEditingChatId(chat.id);
    setTitleInputs((prev) => ({ ...prev, [chat.id]: chat.title ?? "" }));
  };

  // Save chat title change
  const handleSaveTitle = async (chat: DatasetChat) => {
    const newTitle = titleInputs[chat.id]?.trim();
    if (newTitle && newTitle !== chat.title) {
      await updateChatTitle(chat.id, newTitle);
      toast({ description: "Chat title updated." });
    }
    setEditingChatId(null);
  };

  // Cancel title edit
  const handleCancelEdit = (chat: DatasetChat) => {
    setEditingChatId(null);
    setTitleInputs((prev) => ({ ...prev, [chat.id]: chat.title ?? "" }));
  };

  // Delete chat
  const handleDeleteChat = async (chatId: string) => {
    if (window.confirm("Are you sure you want to delete this chat session?")) {
      await deleteChat(chatId);
      if (selectedChatId === chatId) setSelectedChatId(null);
      toast({ description: "Chat deleted." });
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Profile at top */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => navigate("/profile")}
          className="focus:outline-none"
          title="Profile"
        >
          <Avatar className="h-10 w-10 border border-zinc-700 shadow">
            <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.user_metadata?.full_name || user?.email} />
            <AvatarFallback>{getUserInitials()}</AvatarFallback>
          </Avatar>
        </button>
        <div className="text-xs font-semibold text-zinc-300">{user?.user_metadata?.full_name || user?.email}</div>
      </div>

      {/* Chat session selector */}
      <div className="flex flex-col gap-2 mb-2">
        <span className="text-xs text-zinc-400">Chat sessions:</span>
        <ScrollArea className="max-h-44 min-h-0 border border-transparent rounded mb-2 p-1">
          {chatsLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="animate-spin w-4 h-4 text-zinc-400" />
            </div>
          ) : chats?.length ? (
            <div className="flex flex-col gap-2">
              {chats.map((chat: DatasetChat) => (
                <div
                  key={chat.id}
                  className={
                    "flex items-center group gap-2 px-2 py-1 rounded hover:bg-zinc-800/60 transition-all" +
                    (selectedChatId === chat.id ? " bg-zinc-900/60" : "")
                  }
                >
                  {editingChatId === chat.id ? (
                    <>
                      <input
                        className="text-sm font-medium bg-zinc-800 text-zinc-50 rounded px-2 py-1 flex-1 focus:outline focus:ring-2 ring-blue-500"
                        value={titleInputs[chat.id]}
                        autoFocus
                        maxLength={48}
                        onChange={e =>
                          setTitleInputs(prev => ({
                            ...prev,
                            [chat.id]: e.target.value,
                          }))
                        }
                        onKeyDown={e => {
                          if (e.key === "Enter") handleSaveTitle(chat);
                          if (e.key === "Escape") handleCancelEdit(chat);
                        }}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        tabIndex={-1}
                        className="text-green-500"
                        onClick={() => handleSaveTitle(chat)}
                        type="button"
                      >
                        <Save size={16} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        tabIndex={-1}
                        className="text-zinc-400"
                        onClick={() => handleCancelEdit(chat)}
                        type="button"
                      >
                        <X size={16} />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant={chat.id === selectedChatId ? "default" : "secondary"}
                        size="sm"
                        className="flex-1 justify-start truncate px-2"
                        onClick={() => setSelectedChatId(chat.id)}
                        title={chat.title || "Untitled"}
                      >
                        {chat.title ? chat.title : "Untitled"}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => startEditingTitle(chat)}
                        className="text-zinc-500 hover:text-blue-400"
                        title="Rename"
                        tabIndex={-1}
                      >
                        <Pencil size={15} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-red-400 hover:text-red-500"
                        onClick={() => handleDeleteChat(chat.id)}
                        title="Delete"
                        tabIndex={-1}
                      >
                        <Trash2 size={15} />
                      </Button>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-zinc-400 text-sm text-center py-3">No chat sessions yet.</div>
          )}
        </ScrollArea>
        <Button size="sm" variant="outline" onClick={handleStartChat} className="w-full">
          + New Chat
        </Button>
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
