import { useState } from "react";
import DatasetUploader from "@/components/DatasetUploader";
import DatasetSelector from "@/components/DatasetSelector";
import DatasetChatPanel from "@/components/DatasetChatPanel";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { fetchDatasets } from "@/lib/api-service";
import { Loader2, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDatasetChats } from "@/hooks/useDatasetChats";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const Workspace = () => {
  const { user } = useAuth();
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);

  const { data: datasets = [], isLoading, refetch } = useQuery({
    queryKey: ["datasets"],
    queryFn: fetchDatasets,
  });

  // Chats for the sidebar
  const {
    chats = [],
    createChat,
    isLoading: chatsLoading,
    error: chatsError,
    creating,
    updateChatTitle,
    deleteChat
  } = useDatasetChats(selectedDataset, user?.id ?? null);

  const navigate = useNavigate();

  // Helper functions for chat session UI
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [titleInputs, setTitleInputs] = useState<{ [id: string]: string }>({});

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

  // Start editing chat title
  const startEditingTitle = (chatId: string, chatTitle?: string) => {
    setEditingChatId(chatId);
    setTitleInputs((prev) => ({ ...prev, [chatId]: chatTitle ?? "" }));
  };

  // Save chat title change
  const handleSaveTitle = async (chatId: string, chatTitle?: string) => {
    const newTitle = titleInputs[chatId]?.trim();
    if (newTitle && newTitle !== chatTitle) {
      await updateChatTitle(chatId, newTitle);
      // The toast duration will be handled in DatasetChatPanel where toast is called
    }
    setEditingChatId(null);
  };

  // Cancel editing chat title
  const handleCancelEdit = (chatId: string, chatTitle?: string) => {
    setEditingChatId(null);
    setTitleInputs((prev) => ({ ...prev, [chatId]: chatTitle ?? "" }));
  };

  // Delete chat
  const handleDeleteChat = async (chatId: string) => {
    if (window.confirm("Are you sure you want to delete this chat session?")) {
      await deleteChat(chatId);
      if (selectedChatId === chatId) setSelectedChatId(null);
    }
  };

  // Delete dataset (from DB & storage)
  const handleDeleteDataset = async (datasetId: string) => {
    try {
      // Find the dataset details for storage path
      const dataset = datasets.find((ds) => ds.id === datasetId);
      if (!dataset) throw new Error("Could not find dataset");

      // Remove from storage first
      if (dataset.file_path) {
        // Extract storage file path (after bucket base url)
        let storagePath = dataset.file_path;
        const filePathMatch = storagePath.match(/\/datasets\/(.+)$/);
        let key = "";
        if (filePathMatch && filePathMatch[1]) {
          key = filePathMatch[1];
        } else if (storagePath.includes("/object/sign/datasets/")) {
          key = storagePath.split("/object/sign/datasets/")[1]?.split("?")[0] ?? "";
        } else {
          key = storagePath;
        }

        if (key) {
          const { error: storageError } = await supabase.storage
            .from("datasets")
            .remove([key]);
          if (storageError) {
            toast({
              title: "Could not remove file from storage",
              description: storageError.message,
              variant: "destructive",
            });
          }
        }
      }

      // Remove from database
      const { error } = await supabase
        .from("datasets")
        .delete()
        .eq("id", datasetId);

      if (error) {
        toast({
          title: "Failed to delete dataset",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Dataset deleted",
        description: "The dataset has been deleted.",
        variant: "default",
        duration: 3000,
      });
      refetch();
      if (selectedDataset === datasetId) setSelectedDataset(null);
    } catch (e: any) {
      toast({
        title: "Error",
        description: e.message || String(e),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-tr from-[#181924] via-[#23243c] to-[#181825] text-white">
      <header className="flex items-center justify-between px-8 py-5 border-b border-zinc-800/80 backdrop-blur-lg sticky top-0 z-30 bg-[#191925]/80">
        <div className="flex items-center gap-3">
          {/* Icon + Title for Workspace */}
          <span className="flex items-center gap-3">
            <div className="rounded-lg bg-gradient-to-tr from-[#8f8ddb] via-[#445981] to-[#8bbeee] flex items-center justify-center w-10 h-10 shadow">
              <Rocket size={22} className="text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-wide drop-shadow-glow">
              DEXA Workspace
            </span>
          </span>
        </div>
        {/* Profile button moved here from sidebar */}
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
      </header>
      <main className="flex flex-1 flex-col md:flex-row gap-6 p-6 max-w-7xl mx-auto w-full">
        {/* Sidebar: Chat Sessions + Dataset picker */}
        <aside className="w-full md:w-80 bg-[#21222e]/70 backdrop-blur rounded-2xl shadow-lg border border-zinc-700/30 p-5 h-fit flex flex-col gap-5">
          {/* Chat Sessions */}
          <div>
            <span className="text-xs text-zinc-400">Chat sessions:</span>
            <ScrollArea className="max-h-40 min-h-0 border border-transparent rounded mb-2 p-1">
              {chatsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="animate-spin w-4 h-4 text-zinc-400" />
                </div>
              ) : chats?.length ? (
                <div className="flex flex-col gap-2">
                  {chats.slice(0, 3).map((chat) => (
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
                              if (e.key === "Enter") handleSaveTitle(chat.id, chat.title);
                              if (e.key === "Escape") handleCancelEdit(chat.id, chat.title);
                            }}
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            tabIndex={-1}
                            className="text-green-500"
                            onClick={() => handleSaveTitle(chat.id, chat.title)}
                            type="button"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12l5 5l10-10" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            tabIndex={-1}
                            className="text-zinc-400"
                            onClick={() => handleCancelEdit(chat.id, chat.title)}
                            type="button"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
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
                            onClick={() => startEditingTitle(chat.id, chat.title)}
                            className="text-zinc-500 hover:text-blue-400"
                            title="Rename"
                            tabIndex={-1}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M16.475 5.408a2.426 2.426 0 1 1 3.44 3.425L7.95 20.799l-4.544.727.732-4.543 12.337-12.336z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-red-400 hover:text-red-500"
                            onClick={() => handleDeleteChat(chat.id)}
                            title="Delete"
                            tabIndex={-1}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M9 6V4h6v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                  {/* All chats in scroll */}
                  {chats.length > 3 && (
                    <div className="text-xs text-zinc-400 text-center p-1">Scroll for more</div>
                  )}
                </div>
              ) : (
                <div className="text-zinc-400 text-sm text-center py-3">No chat sessions yet.</div>
              )}
            </ScrollArea>
            <Button size="sm" variant="outline" onClick={handleStartChat} className="w-full">
              + New Chat
            </Button>
          </div>
          {/* Dataset List */}
          <div>
            <h3 className="text-lg font-bold mb-3 text-zinc-100">Your Datasets</h3>
            {/* Move DatasetUploader here */}
            <div className="mb-4">
              <DatasetUploader onUploadComplete={refetch} />
            </div>
            {isLoading ? (
              <Loader2 className="animate-spin w-5 h-5 text-zinc-400" />
            ) : (
              <DatasetSelector
                datasets={datasets}
                selectedDataset={selectedDataset}
                onSelectDataset={setSelectedDataset}
                onDeleteDataset={handleDeleteDataset}
              />
            )}
          </div>
        </aside>
        {/* Main: Dataset Preview and Chat */}
        <section className="flex-1 flex flex-col gap-5">
          {!selectedDataset ? (
            <div className="flex flex-col items-center justify-center h-full border border-zinc-700/40 rounded-2xl bg-[#17171e]/60 p-14 shadow">
              <h2 className="text-2xl mb-2 text-zinc-400 font-semibold">
                Select or upload a dataset to begin
              </h2>
            </div>
          ) : (
            <DatasetChatPanel datasetId={selectedDataset} chatId={selectedChatId}/>
          )}
        </section>
      </main>
    </div>
  );
};

export default Workspace;
