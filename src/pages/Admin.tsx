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
  X,
  Bell,
  Check,
  MessageSquare,
  UserCircle
} from "lucide-react";
import AdminServices from "@/components/admin/AdminServices";
import AdminSettings from "@/components/admin/AdminSettings";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminCoupons from "@/components/admin/AdminCoupons";
import AdminAppointments from "@/components/admin/AdminAppointments";
import AdminMessages from "@/components/admin/AdminMessages";
import AdminProfileSettings from "@/components/admin/AdminProfileSettings";
import { supabase } from "@/integrations/supabase/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type AdminTab = "dashboard" | "appointments" | "users" | "services" | "coupons" | "messages" | "settings" | "profile";

interface DashboardStats {
  totalUsers: number;
  totalServices: number;
  activeServices: number;
  totalAppointments: number;
  pendingAppointments: number;
  totalCoupons: number;
  unreadMessages: number;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

const Admin = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({ 
    totalUsers: 0, 
    totalServices: 0, 
    activeServices: 0,
    totalAppointments: 0,
    pendingAppointments: 0,
    totalCoupons: 0,
    unreadMessages: 0,
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
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
      fetchNotifications();
    }
  }, [isAdmin]);

  const fetchStats = async () => {
    const [usersRes, servicesRes, appointmentsRes, couponsRes, messagesRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("services").select("id, is_visible"),
      supabase.from("appointments").select("id, status"),
      supabase.from("coupons").select("id", { count: "exact", head: true }),
      supabase.from("contact_messages").select("id, is_read"),
    ]);

    setStats({
      totalUsers: usersRes.count || 0,
      totalServices: servicesRes.data?.length || 0,
      activeServices: servicesRes.data?.filter(s => s.is_visible).length || 0,
      totalAppointments: appointmentsRes.data?.length || 0,
      pendingAppointments: appointmentsRes.data?.filter(a => a.status === "pending").length || 0,
      totalCoupons: couponsRes.count || 0,
      unreadMessages: messagesRes.data?.filter(m => !m.is_read).length || 0,
    });
  };

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
  };

  const markAsRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    fetchNotifications();
  };

  const markAllAsRead = async () => {
    await supabase.from("notifications").update({ is_read: true }).eq("is_read", false);
    fetchNotifications();
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
    { id: "messages" as AdminTab, label: "Messages", icon: MessageSquare, badge: stats.unreadMessages },
    { id: "users" as AdminTab, label: "Users", icon: Users },
    { id: "coupons" as AdminTab, label: "Coupons", icon: Ticket },
    { id: "profile" as AdminTab, label: "My Profile", icon: UserCircle },
    { id: "settings" as AdminTab, label: "Settings", icon: Settings },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div 
                className="bg-card rounded-xl p-6 border border-border cursor-pointer hover:border-primary transition-colors"
                onClick={() => setActiveTab("users")}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-muted-foreground text-sm mb-2">Total Users</h3>
                    <p className="text-3xl font-bold text-foreground">{stats.totalUsers}</p>
                  </div>
                  <Users className="w-10 h-10 text-primary/50" />
                </div>
              </div>
              <div 
                className="bg-card rounded-xl p-6 border border-border cursor-pointer hover:border-primary transition-colors"
                onClick={() => setActiveTab("services")}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-muted-foreground text-sm mb-2">Services</h3>
                    <p className="text-3xl font-bold text-foreground">{stats.activeServices}/{stats.totalServices}</p>
                    <p className="text-xs text-muted-foreground">visible / total</p>
                  </div>
                  <Briefcase className="w-10 h-10 text-primary/50" />
                </div>
              </div>
              <div 
                className="bg-card rounded-xl p-6 border border-border cursor-pointer hover:border-primary transition-colors"
                onClick={() => setActiveTab("appointments")}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-muted-foreground text-sm mb-2">Appointments</h3>
                    <p className="text-3xl font-bold text-foreground">{stats.totalAppointments}</p>
                    {stats.pendingAppointments > 0 && (
                      <p className="text-xs text-yellow-500">{stats.pendingAppointments} pending</p>
                    )}
                  </div>
                  <Calendar className="w-10 h-10 text-primary/50" />
                </div>
              </div>
              <div 
                className="bg-card rounded-xl p-6 border border-border cursor-pointer hover:border-primary transition-colors"
                onClick={() => setActiveTab("coupons")}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-muted-foreground text-sm mb-2">Coupons</h3>
                    <p className="text-3xl font-bold text-foreground">{stats.totalCoupons}</p>
                  </div>
                  <Ticket className="w-10 h-10 text-primary/50" />
                </div>
              </div>
              <div 
                className="bg-card rounded-xl p-6 border border-border cursor-pointer hover:border-primary transition-colors"
                onClick={() => setActiveTab("messages")}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-muted-foreground text-sm mb-2">Messages</h3>
                    <p className="text-3xl font-bold text-foreground">{stats.unreadMessages}</p>
                    <p className="text-xs text-muted-foreground">unread</p>
                  </div>
                  <MessageSquare className="w-10 h-10 text-primary/50" />
                </div>
              </div>
            </div>
          </div>
        );
      case "services":
        return <AdminServices />;
      case "appointments":
        return <AdminAppointments />;
      case "users":
        return <AdminUsers />;
      case "coupons":
        return <AdminCoupons />;
      case "messages":
        return <AdminMessages />;
      case "profile":
        return <AdminProfileSettings />;
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
                {tab.badge && tab.badge > 0 && (
                  <span className="ml-auto bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded-full">
                    {tab.badge}
                  </span>
                )}
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
      <div className="flex-1 flex flex-col">
        {/* Top Bar with Notifications */}
        <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-end gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="end">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h4 className="font-semibold">Notifications</h4>
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                    <Check className="w-4 h-4 mr-1" /> Mark all read
                  </Button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 ${
                        !notification.is_read ? "bg-primary/5" : ""
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <p className="font-medium text-sm">{notification.title}</p>
                      <p className="text-muted-foreground text-xs mt-1">{notification.message}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    No notifications
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 lg:p-8 pt-16 lg:pt-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Admin;
