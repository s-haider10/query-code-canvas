
// Modern Notion/Apple/Linear Inspired Landing Page
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BrandLogo from "@/components/BrandLogo";

const LandingPage = () => (
  <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-[#14151a] via-[#181924] to-[#131417] text-white">
    <header className="py-8 px-6 flex items-center gap-3 w-full max-w-4xl mx-auto">
      <BrandLogo />
      <span className="text-2xl font-extrabold tracking-tight ml-2 bg-gradient-to-r from-[#8f8ddb] via-[#445981] to-[#8bbeee] bg-clip-text text-transparent">
        DEXA AI: Data Explorer
      </span>
    </header>
    <main className="flex-1 flex flex-col items-center justify-center px-4 w-full">
      <div className="backdrop-blur-[8px] bg-white/5 border border-white/10 rounded-2xl shadow-xl p-12 max-w-2xl mx-auto mb-8">
        <h1 className="text-5xl md:text-6xl font-extrabold leading-tight text-center bg-gradient-to-br from-[#dbeafe] via-white to-[#c6efff] bg-clip-text text-transparent mb-5 drop-shadow">
          Chat with your data.
        </h1>
        <p className="text-lg md:text-2xl text-center text-zinc-300 max-w-xl mb-10 font-medium">
          DEXA empowers you to chat, explore, and analyze any dataset—securely, instantly, and visually.
        </p>
        <div className="flex gap-4 flex-wrap justify-center mb-4">
          <Link to="/app">
            <Button size="lg" className="text-lg rounded-full bg-gradient-to-br from-[#6b8afd] via-[#c58fff] to-[#7cfeeb] shadow-blue-500/20 shadow-lg border border-white/5 hover:bg-[#3a487e] hover:scale-105 transition-transform">
              Try it out
            </Button>
          </Link>
          <Link to="/auth">
            <Button
              size="lg"
              variant="outline"
              className="text-lg rounded-full border-zinc-600 bg-zinc-800/80 hover:bg-zinc-700/70 shadow border backdrop-blur-2xl"
            >
              Login / Sign Up
            </Button>
          </Link>
        </div>
        <div className="mt-8 flex justify-center">
          <img
            src="/default-chart.png"
            alt="Sample Chart"
            className="rounded-xl shadow-lg w-[320px] md:w-[420px] border-zinc-700 border backdrop-blur"
            style={{ background: "rgba(34,37,46,0.5)" }}
          />
        </div>
      </div>
      <footer className="w-full text-center py-6 text-zinc-500 text-sm mt-12">
        &copy; {new Date().getFullYear()} DEXA AI. All rights reserved.
      </footer>
    </main>
  </div>
);

export default LandingPage;

