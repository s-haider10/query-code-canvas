
import { ReactNode, useEffect } from "react";
import Sidebar from "./Sidebar";

const Layout = ({ children }: { children: ReactNode }) => {
  // Always set dark mode
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <div className="min-h-screen w-full flex bg-gradient-to-br from-[#17171a] to-[#181924] text-zinc-50 transition-colors">
      <Sidebar />
      <div className="flex-1 flex flex-col relative">
        <header className="flex items-center justify-between px-8 py-6 border-b border-zinc-800 backdrop-blur-sm">
          <div />
          {/* ThemeToggle removed: dark mode is always on */}
        </header>
        <main className="flex-1 flex justify-center">
          <div className="w-full max-w-3xl px-4 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
