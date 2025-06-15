
import BrandLogo from "../BrandLogo";
import { Home, Upload, MessageSquare, Notebook } from "lucide-react";

const Sidebar = () => {
  return (
    <aside className="hidden md:flex flex-col bg-white/70 dark:bg-[#121214]/80 border-r border-zinc-200 dark:border-zinc-800 w-20 py-6 px-2 min-h-screen items-center gap-6 shadow-sm fixed left-0 top-0 z-40">
      <BrandLogo />
      <nav className="flex flex-col gap-8 mt-8 text-zinc-500 dark:text-zinc-400">
        <button className="hover:text-black hover:dark:text-white transition"><Home size={20}/></button>
        <button className="hover:text-black hover:dark:text-white transition"><Upload size={20}/></button>
        <button className="hover:text-black hover:dark:text-white transition"><MessageSquare size={20}/></button>
        <button className="hover:text-black hover:dark:text-white transition"><Notebook size={20}/></button>
      </nav>
    </aside>
  );
};

export default Sidebar;
