
// Dark modern glassy nav
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

const Navigation = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      toast({ description: "You have been signed out" });
    } catch (error) {
      toast({ 
        variant: "destructive", 
        title: "Error", 
        description: "An error occurred while signing out." 
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  const getUserInitials = () => {
    if (!user) return "?";
    if (user.user_metadata.full_name) {
      return user.user_metadata.full_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase();
    }
    return user.email?.charAt(0).toUpperCase() || "U";
  };

  return (
    <header className="bg-[#161720]/75 border-b border-zinc-800/70 shadow backdrop-blur-lg sticky top-0 z-40">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div>
          <Link to="/" className="hover:underline">
            <h1 className="text-2xl font-bold text-white tracking-wide">DEXA AI</h1>
          </Link>
          <p className="text-zinc-400">Chat with your data instantly</p>
        </div>
        
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-zinc-700/60 transition-shadow shadow">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.user_metadata.avatar_url} alt={user.user_metadata.full_name || user.email} />
                  <AvatarFallback>{getUserInitials()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-[#23243c] border-zinc-700 text-white shadow-xl rounded-xl min-w-[200px]">
              <div className="flex items-center justify-start gap-2 p-2">
                <div className="flex flex-col space-y-1 leading-none">
                  {user.user_metadata.full_name && (
                    <p className="font-medium">{user.user_metadata.full_name}</p>
                  )}
                  <p className="text-sm text-zinc-400">{user.email}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/" className="cursor-pointer w-full">Home</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/advanced" className="cursor-pointer w-full">Advanced Analysis</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleSignOut} 
                disabled={isSigningOut} 
                className="cursor-pointer text-red-400 focus:text-red-500"
              >
                {isSigningOut ? "Signing out..." : "Sign out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link to="/auth">
            <Button className="rounded-full bg-gradient-to-r from-[#8f8ddb] via-[#445981] to-[#8bbeee] text-white shadow hover:opacity-90">Sign In</Button>
          </Link>
        )}
      </div>
    </header>
  );
};

export default Navigation;

