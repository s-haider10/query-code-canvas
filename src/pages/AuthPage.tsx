
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import BrandLogo from "@/components/BrandLogo";

const AuthPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      toast({ description: "Logged in successfully!" });
      navigate('/');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message || "An error occurred during login."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
        },
      });
      if (error) throw error;
      toast({
        description: "Registration successful! You can now log in."
      });
      // Switch to login tab (new users will need to check emails if confirm email is on)
      document.querySelector('[data-state="inactive"]')?.setAttribute('data-state', 'active');
      document.querySelector('[data-state="active"]')?.setAttribute('data-state', 'inactive');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Signup failed",
        description: error.message || "An error occurred during signup."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#14151a] via-[#191925] to-[#131417] px-4">
      <div className="w-full max-w-md mx-auto animate-fade-in">
        <Card className="bg-[#1a1a25]/90 border border-white/10 shadow-2xl rounded-3xl backdrop-blur-xl">
          <CardHeader className="text-center flex flex-col items-center gap-2 pt-8 pb-3">
            <BrandLogo />
            <span className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-[#8f8ddb] via-[#445981] to-[#8bbeee] bg-clip-text text-transparent">
              DEXA AI
            </span>
            <CardTitle className="sr-only">Data Analysis Platform</CardTitle>
            <CardDescription className="text-zinc-400 mt-2 mb-0 font-medium">
              Login or create an account to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid grid-cols-2 w-full bg-[#22223a]/60 border border-white/10 backdrop-blur rounded-xl mb-4">
                <TabsTrigger value="login" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#252548] data-[state=active]:to-[#20202f] data-[state=active]:text-white data-[state=active]:shadow text-zinc-400 rounded-xl">Login</TabsTrigger>
                <TabsTrigger value="signup" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#252548] data-[state=active]:to-[#20202f] data-[state=active]:text-white data-[state=active]:shadow text-zinc-400 rounded-xl">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="animate-fade-in">
                <form onSubmit={handleLogin} className="space-y-5 mt-2">
                  <div className="space-y-1">
                    <label htmlFor="email" className="text-sm font-semibold text-zinc-200">Email</label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      required
                      disabled={loading}
                      className="bg-[#191924] border-zinc-700/50 placeholder-zinc-500 text-white focus-visible:ring-2 focus-visible:ring-[#8bbeee]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="password" className="text-sm font-semibold text-zinc-200">Password</label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="•••••••••"
                      required
                      disabled={loading}
                      className="bg-[#191924] border-zinc-700/50 placeholder-zinc-500 text-white focus-visible:ring-2 focus-visible:ring-[#8bbeee]"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-11 rounded-xl font-semibold bg-gradient-to-br from-[#6b8afd] via-[#c58fff] to-[#7cfeeb] shadow-lg shadow-blue-600/10 hover:bg-[#3a487e] hover:scale-[1.02] transition"
                    disabled={loading}
                  >
                    {loading ? "Logging in..." : "Login"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="animate-fade-in">
                <form onSubmit={handleSignup} className="space-y-5 mt-2">
                  <div className="space-y-1">
                    <label htmlFor="name" className="text-sm font-semibold text-zinc-200">Full Name</label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Doe"
                      required
                      disabled={loading}
                      className="bg-[#191924] border-zinc-700/50 placeholder-zinc-500 text-white focus-visible:ring-2 focus-visible:ring-[#8bbeee]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="signup-email" className="text-sm font-semibold text-zinc-200">Email</label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      required
                      disabled={loading}
                      className="bg-[#191924] border-zinc-700/50 placeholder-zinc-500 text-white focus-visible:ring-2 focus-visible:ring-[#8bbeee]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="signup-password" className="text-sm font-semibold text-zinc-200">Password</label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="•••••••••"
                      required
                      disabled={loading}
                      minLength={6}
                      className="bg-[#191924] border-zinc-700/50 placeholder-zinc-500 text-white focus-visible:ring-2 focus-visible:ring-[#8bbeee]"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-11 rounded-xl font-semibold bg-gradient-to-br from-[#6b8afd] via-[#c58fff] to-[#7cfeeb] shadow-lg shadow-blue-600/10 hover:bg-[#3a487e] hover:scale-[1.02] transition"
                    disabled={loading}
                  >
                    {loading ? "Creating account..." : "Create account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 text-center border-t border-white/10 mt-4 px-8 py-6">
            <span className="text-xs text-zinc-500 font-medium">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </span>
          </CardFooter>
        </Card>
        <div className="mt-8 text-zinc-600 text-xs text-center">
          &copy; {new Date().getFullYear()} DEXA AI. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
