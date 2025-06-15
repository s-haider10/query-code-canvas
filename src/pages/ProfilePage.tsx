
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import GlobalNav from "@/components/GlobalNav";

const ProfilePage = () => {
  const { user } = useAuth();
  if (!user) return (<div className="flex flex-col min-h-screen"><GlobalNav /><div className="flex justify-center items-center flex-1"><div className="text-zinc-400">Not signed in.</div></div></div>);

  const initials = user.user_metadata?.full_name
    ? user.user_metadata.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
    : user.email?.charAt(0).toUpperCase() || "U";

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#191925] via-[#181825] to-[#21222e]">
      <GlobalNav />
      <div className="flex flex-col items-center justify-center flex-1">
        <div className="bg-[#1a1a25]/90 border border-zinc-600/40 p-10 rounded-2xl shadow-2xl flex flex-col items-center w-full max-w-md mt-12">
          <Avatar className="w-24 h-24 mb-4 border border-zinc-700 shadow">
            <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.full_name || user.email} />
            <AvatarFallback className="text-3xl">{initials}</AvatarFallback>
          </Avatar>
          <div className="text-2xl font-bold text-white mb-2">{user.user_metadata?.full_name || "No name"}</div>
          <div className="text-zinc-400 mb-6">{user.email}</div>
          <div className="flex gap-4">
            {/* You can add profile actions here */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
