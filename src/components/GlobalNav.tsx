
import { Link, useLocation } from "react-router-dom";
import BrandLogo from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/app", label: "Workspace" },
  { to: "/advanced", label: "Advanced" },
];

const GlobalNav = () => {
  const location = useLocation();
  const { user } = useAuth();

  const getUserInitials = () => {
    if (!user) return "?";
    if (user.user_metadata?.full_name) {
      return user.user_metadata.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase();
    }
    return user.email?.charAt(0).toUpperCase() || "U";
  };

  return (
    <nav className="w-full sticky top-0 z-40 bg-gradient-to-b from-[#161720]/90 via-[#181924]/95 to-transparent border-b border-zinc-800/60 backdrop-blur-xl flex items-center justify-between px-6 py-3">
      <Link to="/" className="flex items-center gap-2">
        <BrandLogo />
        <span className="text-xl font-bold bg-gradient-to-r from-[#8f8ddb] via-[#445981] to-[#8bbeee] bg-clip-text text-transparent tracking-tight">
          DEXA AI
        </span>
      </Link>
      <div className="flex items-center gap-2">
        {navLinks.map(link => (
          <Link
            to={link.to}
            key={link.to}
            className={`hidden md:inline text-sm font-medium px-4 py-1 rounded-full transition 
              ${location.pathname === link.to
                ? "bg-zinc-800/60 text-white"
                : "text-zinc-300 hover:text-white hover:bg-zinc-800/40"}`}
          >
            {link.label}
          </Link>
        ))}
        {user ? (
          <Link to="/profile" className="ml-2">
            <Avatar className="h-9 w-9 border border-zinc-700 shadow">
              <AvatarImage src={user.user_metadata?.avatar_url} alt={user.user_metadata?.full_name || user.email} />
              <AvatarFallback>{getUserInitials()}</AvatarFallback>
            </Avatar>
          </Link>
        ) : (
          <Link to="/auth" className="ml-2">
            <Button className="rounded-full bg-gradient-to-r from-[#8f8ddb] via-[#445981] to-[#8bbeee] text-white shadow hover:opacity-90" size="sm">
              Sign In
            </Button>
          </Link>
        )}
      </div>
    </nav>
  );
};

export default GlobalNav;
