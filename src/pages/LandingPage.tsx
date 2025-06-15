
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BrandLogo from "@/components/BrandLogo";

const LandingPage = () => (
  <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-blue-50 to-purple-100">
    <header className="py-8 px-6 flex items-center gap-3">
      <BrandLogo />
      <span className="text-2xl font-extrabold text-primary tracking-tight ml-2">DEXA AI: Data Explorer</span>
    </header>
    <main className="flex-1 flex flex-col items-center justify-center px-4">
      <h1 className="text-4xl md:text-6xl font-bold text-center text-zinc-800 max-w-2xl mb-6 leading-tight">
        Chat with Your Data Instantly
      </h1>
      <p className="text-lg md:text-2xl text-center text-zinc-700 max-w-xl mb-10">
        DEXA empowers everyone to explore, analyze, and visualize datasets with natural language. Upload your files, ask questions, and get insights—all powered by AI.
      </p>
      <div className="flex gap-4 flex-wrap justify-center mb-8">
        <Link to="/app">
          <Button size="lg" className="text-lg bg-primary">Try it out</Button>
        </Link>
        <Link to="/auth">
          <Button size="lg" variant="outline" className="text-lg">Login / Sign Up</Button>
        </Link>
      </div>
      <div className="mt-8">
        <img
          src="/default-chart.png"
          alt="Sample Chart"
          className="rounded-lg shadow-lg w-[360px] md:w-[520px] border"
        />
      </div>
    </main>
    <footer className="w-full text-center py-6 text-zinc-500 text-sm">
      &copy; {new Date().getFullYear()} DEXA AI. All rights reserved.
    </footer>
  </div>
);

export default LandingPage;
