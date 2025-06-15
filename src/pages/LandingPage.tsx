
// Modern Notion/Apple/Linear Inspired Landing Page
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import BrandLogo from "@/components/BrandLogo";
import { BarChart, MessageSquare, CheckCircle } from "lucide-react";

const features = [
  {
    icon: <BarChart className="w-7 h-7 text-[#8bbeee]" />,
    title: "Visual Analytics",
    desc: "Turn raw data into beautiful, interactive charts and graphs. Instantly see insights come alive.",
  },
  {
    icon: <MessageSquare className="w-7 h-7 text-[#8f8ddb]" />,
    title: "Conversational AI",
    desc: "Ask questions in plain English—DEXA responds with analysis, summaries, or custom visuals.",
  },
  {
    icon: <CheckCircle className="w-7 h-7 text-[#6b8afd]" />,
    title: "Secure & Private",
    desc: "Chat and analyze with confidence—your data stays secure and private, always.",
  },
];

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
        <h1 className="text-[2.3rem] md:text-6xl font-extrabold leading-tight text-center bg-gradient-to-br from-[#dbeafe] via-white to-[#c6efff] bg-clip-text text-transparent mb-5 drop-shadow">
          Instantly chat <br className="md:hidden"/> with your data.
        </h1>
        <p className="text-lg md:text-2xl text-center text-zinc-300 max-w-xl mb-8 font-medium">
          Upload any spreadsheet or dataset. DEXA transforms it into an AI-powered chat—so you can ask, analyze, and visualize anything in seconds.
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
        <div className="mx-auto max-w-xl">
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 mb-6">
            {features.map((f, i) => (
              <li
                key={i}
                className="flex flex-col items-center text-center bg-zinc-900/70 border border-zinc-800/60 rounded-2xl p-5 shadow-inner min-h-[170px]"
              >
                <span className="mb-3">{f.icon}</span>
                <h3 className="font-semibold text-lg mb-1">{f.title}</h3>
                <p className="text-zinc-400 text-[0.98rem]">{f.desc}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-6 flex justify-center">
          <img
            src="/default-chart.png"
            alt="Sample Chart"
            className="rounded-xl shadow-lg w-[320px] md:w-[420px] border-zinc-700 border backdrop-blur"
            style={{ background: "rgba(34,37,46,0.5)" }}
          />
        </div>
      </div>
      <footer className="w-full text-center py-6 text-zinc-500 text-sm mt-10">
        &copy; {new Date().getFullYear()} DEXA AI. Built for secure, no-fuss data exploration.
      </footer>
    </main>
  </div>
);

export default LandingPage;
