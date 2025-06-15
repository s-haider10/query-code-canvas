
import { Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

const NotFound = () => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#17171a] to-[#181924] text-zinc-50">
      <div className="bg-[#23243c]/80 border border-zinc-800 rounded-2xl shadow-xl p-10 md:p-16 flex flex-col items-center max-w-md mx-4">
        <AlertTriangle size={48} className="text-yellow-400 mb-4" />
        <h1 className="text-5xl font-extrabold mb-4 tracking-tight drop-shadow-glow">404</h1>
        <p className="text-lg md:text-xl text-zinc-300 mb-6 text-center">
          Oops! This page doesn't exist.<br />You may have mistyped the address or followed a broken link.
        </p>
        <Link
          to="/"
          className="inline-block font-semibold rounded-full px-6 py-2 bg-gradient-to-tr from-[#8f8ddb] via-[#445981] to-[#8bbeee] text-white shadow hover:opacity-90 transition"
        >
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
