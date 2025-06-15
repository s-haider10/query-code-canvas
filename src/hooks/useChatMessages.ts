
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChatMessage } from "@/types/dataset";

// Messages hook for a single chat session
export function useChatMessages(chatId: string | null) {
  const queryClient = useQueryClient();

  const { data: messages, isLoading, error } = useQuery({
    queryKey: ["chat_messages", chatId],
    queryFn: async () => {
      if (!chatId) return [];
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as ChatMessage[];
    },
    enabled: !!chatId,
  });

  // Send a message (user or assistant)
  const sendMessage = useMutation({
    mutationFn: async (payload: { role: "user" | "assistant"; content: string; user_id: string }) => {
      if (!chatId) throw new Error("Chat not selected");
      const toInsert = {
        chat_id: chatId,
        role: payload.role,
        content: payload.content,
        user_id: payload.user_id,
      };
      const { data, error } = await supabase
        .from("chat_messages")
        .insert([toInsert])
        .select()
        .single();
      if (error) throw error;
      return data as ChatMessage;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat_messages", chatId] });
    },
  });

  return {
    messages,
    isLoading,
    error,
    sendMessage: sendMessage.mutateAsync,
    sending: sendMessage.isPending,
  };
}
