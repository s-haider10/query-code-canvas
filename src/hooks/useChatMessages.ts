
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

  // Extended: Send user message, call OpenAI, save assistant reply
  const sendUserMessageWithAIReply = async ({
    user_id,
    userContent,
    data_profile,
  }: {
    user_id: string;
    userContent: string;
    data_profile: string;
  }) => {
    if (!chatId) throw new Error("Chat not selected");
    // 1. Save user message
    await sendMessage.mutateAsync({ role: "user", content: userContent, user_id });
    // 2. Call ai-chat edge function for reply
    // The function expects { query, data_profile }
    let aiReply: string | null = null;
    try {
      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: {
          query: userContent,
          data_profile,
        },
      });
      if (error) {
        // If error, store a placeholder
        aiReply = "Sorry, there was an error getting a response from the AI assistant.";
      } else {
        aiReply = (data as any)?.content ?? "No response from AI assistant.";
      }
    } catch (err) {
      aiReply = "Sorry, there was an internal error getting a response from the AI assistant.";
    }
    // 3. Save assistant reply
    await sendMessage.mutateAsync({
      role: "assistant",
      content: aiReply,
      user_id,
    });
  };

  return {
    messages,
    isLoading,
    error,
    sendMessage: sendMessage.mutateAsync,
    sendUserMessageWithAIReply, // New: wraps user message + AI reply
    sending: sendMessage.isPending,
  };
}

