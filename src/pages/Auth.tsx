import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, User, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginMode, setLoginMode] = useState<"username" | "email">("username");
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string>("Welcome Back");
  
  const { signIn, signOut, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const hasRedirected = useRef(false);

  // Fetch company logo and name from settings
  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["auth_logo_url", "company_name"]);
      
      if (data) {
        data.forEach((setting) => {
          if (setting.key === "auth_logo_url" && setting.value) {
            setCompanyLogo(setting.value);
          }
          if (setting.key === "company_name" && setting.value) {
            setCompanyName(setting.value);
          }
        });
      }
    };
    fetchSettings();
  }, []);

  // Redirect logged-in users to appropriate panel
  useEffect(() => {
    if (user && !hasRedirected.current) {
      hasRedirected.current = true;
      const checkAndRedirect = async () => {
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id);
        
        const userRoles = roles?.map(r => r.role) || [];
        const isAdminUser = userRoles.includes("admin") || userRoles.includes("super_admin");
        
        navigate(isAdminUser ? "/admin" : "/dashboard");
      };
      checkAndRedirect();
    }
  }, [user, navigate]);

  const checkFrozenStatus = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("is_frozen")
      .eq("user_id", userId)
      .maybeSingle();
    
    if (error) {
      console.error("Error checking frozen status:", error);
      return false;
    }
    
    return (data as any)?.is_frozen ?? false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // If username mode, convert to email format
      let email = loginId;
      if (loginMode === "username") {
        // Check if it's already an email
        if (!loginId.includes("@")) {
          email = `${loginId}@krishnatech.internal`;
        }
      }

      const { error } = await signIn(email, password);
      if (error) {
        toast({
          title: "Login Failed",
          description: loginMode === "username" ? "Invalid username or password" : error.message,
          variant: "destructive",
        });
      } else {
        // Check if account is frozen
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const isFrozen = await checkFrozenStatus(user.id);
          if (isFrozen) {
            await signOut();
            toast({
              title: "Account Frozen",
              description: "Your account is not accessible. Please contact admin for assistance.",
              variant: "destructive",
            });
            setIsLoading(false);
            return;
          }

          // Check if user is admin/super_admin
          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", user.id);

          const userRoles = roles?.map(r => r.role) || [];
          const isAdminUser = userRoles.includes("admin") || userRoles.includes("super_admin");
          
          toast({
            title: "Welcome back!",
            description: "You have successfully logged in.",
          });
          
          navigate(isAdminUser ? "/admin" : "/dashboard");
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl p-8 border border-border shadow-lg">
          <div className="text-center mb-8">
            {companyLogo ? (
              <img 
                src={companyLogo} 
                alt="Company Logo" 
                className="h-16 w-auto mx-auto mb-4 object-contain"
              />
            ) : null}
            <h1 className="text-2xl font-bold text-foreground mb-2">{companyName}</h1>
            <p className="text-muted-foreground">Sign in to access your account</p>
          </div>

          {/* Login Mode Toggle */}
          <div className="flex mb-6 bg-muted/50 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setLoginMode("username")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                loginMode === "username"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <User className="w-4 h-4" />
              Username
            </button>
            <button
              type="button"
              onClick={() => setLoginMode("email")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                loginMode === "email"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Mail className="w-4 h-4" />
              Email
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {loginMode === "username" ? "Username" : "Email"}
              </label>
              <Input
                type={loginMode === "email" ? "email" : "text"}
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder={loginMode === "username" ? "Enter your username" : "you@example.com"}
                required
              />
              {loginMode === "username" && (
                <p className="text-xs text-muted-foreground mt-1">
                  Enter just your username without @
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Please wait..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Need an account? Contact your administrator.
            </p>
          </div>

          <div className="mt-6 text-center">
            <a href="/" className="text-muted-foreground hover:text-foreground text-sm">
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
