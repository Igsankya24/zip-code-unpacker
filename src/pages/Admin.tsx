import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Settings, 
  LogOut,
  Briefcase,
  Ticket,
  Menu,
  X
} from "lucide-react";
import AdminServices from "@/components/admin/AdminServices";
import AdminSettings from "@/components/admin/AdminSettings";
import { supabase } from "@/integrations/supabase/client";

type AdminTab = "dashboard" | "appointments" | "users" | "services" | "coupons" | "settings";

interface DashboardStats {
  totalUsers: number;
  totalServices: number;
  activeServices: number;
}

const Admin = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({ totalUsers: 0, totalServices: 0, activeServices: 0 });
  const { user, isAdmin, isLoading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (!isLoading && user && !isAdmin) {
      navigate("/");
    }
  }, [isAdmin, isLoading, user, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
    }
  }, [isAdmin]);

  const fetchStats = async () => {
    const [usersRes, servicesRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("services").select("id, is_visible"),
    ]);

    setStats({
      totalUsers: usersRes.count || 0,
      totalServices: servicesRes.data?.length || 0,
      activeServices: servicesRes.data?.filter(s => s.is_visible).length || 0,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const tabs = [
    { id: "dashboard" as AdminTab, label: "Dashboard", icon: LayoutDashboard },
    { id: "services" as AdminTab, label: "Services", icon: Briefcase },
    { id: "appointments" as AdminTab, label: "Appointments", icon: Calendar },
    { id: "users" as AdminTab, label: "Users", icon: Users },
    { id: "coupons" as AdminTab, label: "Coupons", icon: Ticket },
    { id: "settings" as AdminTab, label: "Settings", icon: Settings },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-card rounded-xl p-6 border border-border">
                <h3 className="text-muted-foreground text-sm mb-2">Total Appointments</h3>
                <p className="text-3xl font-bold text-foreground">0</p>
              </div>
              <div className="bg-card rounded-xl p-6 border border-border">
                <h3 className="text-muted-foreground text-sm mb-2">Total Users</h3>
                <p className="text-3xl font-bold text-foreground">{stats.totalUsers}</p>
              </div>
              <div className="bg-card rounded-xl p-6 border border-border">
                <h3 className="text-muted-foreground text-sm mb-2">Total Services</h3>
                <p className="text-3xl font-bold text-foreground">{stats.totalServices}</p>
              </div>
              <div className="bg-card rounded-xl p-6 border border-border">
                <h3 className="text-muted-foreground text-sm mb-2">Visible Services</h3>
                <p className="text-3xl font-bold text-foreground">{stats.activeServices}</p>
              </div>
            </div>
          </div>
        );
      case "services":
        return <AdminServices />;
      case "appointments":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Appointments</h2>
            <p className="text-muted-foreground">Manage customer appointments here.</p>
          </div>
        );
      case "users":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Users</h2>
            <p className="text-muted-foreground">Manage user accounts and roles.</p>
          </div>
        );
      case "coupons":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Coupons</h2>
            <p className="text-muted-foreground">Manage discount coupons.</p>
          </div>
        );
      case "settings":
        return <AdminSettings />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-card rounded-lg border border-border"
      >
        {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-border">
            <h1 className="text-xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-sm text-muted-foreground mt-1">Krishna Tech Solutions</p>
          </div>

          <nav className="flex-1 p-4 space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-border">
            <div className="mb-4 px-4">
              <p className="text-sm font-medium text-foreground">Admin</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleSignOut}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 p-6 lg:p-8 pt-16 lg:pt-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default Admin;
