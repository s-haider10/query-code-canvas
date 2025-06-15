
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
    <div className="flex flex-col min-h-screen bg-gradient-to-tr from-[#181924] via-[#23243c] to-[#181825] text-white">
      <header className="flex items-center justify-between px-8 py-5 border-b border-zinc-800/80 backdrop-blur-lg sticky top-0 z-30 bg-[#191925]/80">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-white tracking-wide">
            DEXA Workspace
          </span>
        </div>
        <DatasetUploader onUploadComplete={refetch} />
      </header>
      <main className="flex flex-1 flex-col md:flex-row gap-6 p-6 max-w-7xl mx-auto w-full">
        {/* Sidebar: Dataset picker */}
        <aside className="w-full md:w-80 bg-[#21222e]/70 backdrop-blur rounded-2xl shadow-lg border border-zinc-700/30 p-5 h-fit">
          <h3 className="text-lg font-bold mb-3 text-zinc-100">Your Datasets</h3>
          {isLoading ? (
            <Loader2 className="animate-spin w-5 h-5 text-zinc-400" />
          ) : (
            <DatasetSelector
              datasets={datasets}
              selectedDataset={selectedDataset}
              onSelectDataset={setSelectedDataset}
            />
          )}
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
            <DatasetChatPanel datasetId={selectedDataset} />
          )}
        </section>
      </main>
    </div>
  );
};

export default Workspace;
