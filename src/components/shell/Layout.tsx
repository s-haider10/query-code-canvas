
import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import ThemeToggle from "../ThemeToggle";

const Layout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen w-full flex bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-[#17171a] dark:to-[#181924] transition-colors">
      <Sidebar />
      <div className="flex-1 flex flex-col relative">
        <header className="flex items-center justify-between px-8 py-6 border-b border-zinc-200 dark:border-zinc-800 backdrop-blur-sm">
          <div />
          <ThemeToggle />
        </header>
        <main className="flex-1 flex justify-center">
          <div className="w-full max-w-3xl px-4 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
