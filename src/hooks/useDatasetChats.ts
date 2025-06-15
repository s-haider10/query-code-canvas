
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DatasetChat } from "@/types/dataset";

export function useDatasetChats(datasetId: string | null) {
  const queryClient = useQueryClient();

  // Fetch chats for the current user for a given dataset
  const { data: chats, isLoading, error } = useQuery({
    queryKey: ["dataset_chats", datasetId],
    queryFn: async () => {
      if (!datasetId) return [];
      const { data, error } = await supabase
        .from("dataset_chats")
        .select("*")
        .eq("dataset_id", datasetId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as DatasetChat[];
    },
    enabled: !!datasetId,
  });

  // Mutation to create a new chat session
  const createChatMutation = useMutation({
    mutationFn: async (title?: string) => {
      if (!datasetId) throw new Error("No dataset selected");
      const { data, error } = await supabase
        .from("dataset_chats")
        .insert([{ dataset_id: datasetId, title }])
        .select()
        .single();
      if (error) throw error;
      return data as DatasetChat;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dataset_chats", datasetId] });
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
