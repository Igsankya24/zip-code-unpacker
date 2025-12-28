import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface Settings {
  [key: string]: string;
}

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [s, setS] = useState<Settings>({});
  const location = useLocation();
  const { user, signOut } = useAuth();

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from("site_settings").select("key, value");
      if (data) {
        const settingsObj: Settings = {};
        data.forEach((item) => { settingsObj[item.key] = item.value; });
        setS(settingsObj);
      }
    };
    fetchSettings();
  }, []);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Services", path: "/services" },
    { name: "About", path: "/about" },
    { name: "Contact", path: "/contact" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Monitor className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-bold text-lg text-foreground leading-tight">
                {s.navbar_company_name || "Krishna Tech"}
              </span>
              <span className="text-xs text-muted-foreground -mt-0.5">
                {s.navbar_company_tagline || "Solutions"}
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`relative font-medium transition-colors duration-300 ${
                  isActive(link.path) ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.name}
                {isActive(link.path) && (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-accent rounded-full" />
                )}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {s.navbar_show_theme !== "false" && <ThemeToggle />}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm">
                        {user.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium truncate">{user.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => signOut()} className="text-destructive cursor-pointer">
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            <Link to={s.navbar_cta_link || "/contact"}>
              <Button variant="hero" size="default">
                {s.navbar_cta_text || "Get Support"}
              </Button>
            </Link>
          </div>

          <button className="md:hidden p-2 text-foreground" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden absolute top-20 left-0 right-0 bg-background border-b border-border animate-slide-up">
          <div className="container mx-auto px-4 py-6 flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
                  isActive(link.path) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {link.name}
              </Link>
            ))}
            {user && (
              <Button variant="ghost" className="w-full text-destructive" onClick={() => { signOut(); setIsOpen(false); }}>
                Sign Out
              </Button>
            )}
            <Link to={s.navbar_cta_link || "/contact"} onClick={() => setIsOpen(false)}>
              <Button variant="hero" className="w-full mt-2">
                {s.navbar_cta_text || "Get Support"}
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
