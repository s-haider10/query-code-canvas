
import { useState } from "react";
import DatasetUploader from "@/components/DatasetUploader";
import DatasetSelector from "@/components/DatasetSelector";
import DatasetChatPanel from "@/components/DatasetChatPanel";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { fetchDatasets } from "@/lib/api-service";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const Workspace = () => {
  const { user } = useAuth();
  const [selectedDataset, setSelectedDataset] = useState<string | null>(null);

  const { data: datasets = [], isLoading, refetch } = useQuery({
    queryKey: ["datasets"],
    queryFn: fetchDatasets,
  });

  return (
    <div className="flex flex-col h-full min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <header className="flex items-center justify-between px-6 py-4 bg-white shadow">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-primary">DEXA Workspace</span>
        </div>
        <div>
          <DatasetUploader onUploadComplete={refetch} />
        </div>
      </header>
      <main className="flex flex-1 flex-col md:flex-row gap-6 p-6">
        {/* Sidebar: Dataset picker */}
        <aside className="w-full md:w-64 bg-white rounded-lg shadow h-fit p-4">
          <h3 className="text-lg font-bold mb-2">Your Datasets</h3>
          {isLoading ? (
            <Loader2 className="animate-spin w-4 h-4 text-zinc-400" />
          ) : (
            <DatasetSelector
              datasets={datasets}
              selectedDataset={selectedDataset}
              onSelectDataset={setSelectedDataset}
            />
          )}
        </aside>
        {/* Main: Dataset Preview and Chat */}
        <section className="flex-1 flex flex-col gap-6">
          {!selectedDataset ? (
            <div className="flex flex-col items-center justify-center h-full border rounded-lg bg-white p-12">
              <h2 className="text-xl mb-2 text-muted-foreground">Select or upload a dataset to begin</h2>
            </div>
          ) : (
            <DatasetChatPanel datasetId={selectedDataset} />
          )}
        </section>
      </main>
    </div>
  );
};

export default Workspace;
