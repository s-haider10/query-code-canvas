
// Dark glassy Apple/Notion/Linear sidebar
import BrandLogo from "../BrandLogo";
import { Home, Upload, MessageSquare, Notebook } from "lucide-react";

const Sidebar = () => {
  return (
    <aside className="hidden md:flex flex-col bg-[#1a1a25]/90 border-r border-zinc-800/80 w-20 py-6 px-2 min-h-screen items-center gap-6 shadow-xl backdrop-blur-xl rounded-r-2xl z-40">
      <BrandLogo />
      <nav className="flex flex-col gap-8 mt-8 text-zinc-500">
        <button className="hover:text-zinc-100 transition-all"><Home size={22}/></button>
        <button className="hover:text-zinc-100 transition-all"><Upload size={22}/></button>
        <button className="hover:text-zinc-100 transition-all"><MessageSquare size={22}/></button>
        <button className="hover:text-zinc-100 transition-all"><Notebook size={22}/></button>
      </nav>
    </aside>
  );
};

export default Sidebar;
