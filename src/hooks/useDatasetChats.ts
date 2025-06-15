
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DatasetChat } from "@/types/dataset";

/**
 * Hook for managing chat sessions for a dataset and user.
 * @param datasetId - The dataset id.
 * @param userId - The current user's id (required for create).
 */
export function useDatasetChats(datasetId: string | null, userId: string | null) {
  const queryClient = useQueryClient();

  // Fetch chats for this user for a given dataset
  const { data: chats, isLoading, error } = useQuery({
    queryKey: ["dataset_chats", datasetId, userId],
    queryFn: async () => {
      if (!datasetId || !userId) return [];
      const { data, error } = await supabase
        .from("dataset_chats")
        .select("*")
        .eq("dataset_id", datasetId)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as DatasetChat[];
    },
    enabled: !!datasetId && !!userId,
  });

  // Mutation to create a new chat session
  const createChatMutation = useMutation({
    mutationFn: async (title?: string | null) => {
      if (!datasetId || !userId) throw new Error("No dataset/user selected");
      const { data, error } = await supabase
        .from("dataset_chats")
        .insert([{ dataset_id: datasetId, user_id: userId, title: title ?? null }])
        .select()
        .single();
      if (error) throw error;
      return data as DatasetChat;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dataset_chats", datasetId, userId] });
    },
  });

  return {
    chats,
    isLoading,
    error,
    createChat: createChatMutation.mutateAsync,
    creating: createChatMutation.isPending,
  };
}
