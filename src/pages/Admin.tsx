import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";
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
  UserCircle,
  Bot,
  Shield,
  Trash2,
  Paintbrush,
  UserCog,
  BarChart3,
  Lock,
  FileText
} from "lucide-react";
import AdminServices from "@/components/admin/AdminServices";
import AdminSettings from "@/components/admin/AdminSettings";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminCoupons from "@/components/admin/AdminCoupons";
import AdminAppointments from "@/components/admin/AdminAppointments";
import AdminMessages from "@/components/admin/AdminMessages";
import AdminProfileSettings from "@/components/admin/AdminProfileSettings";
import AdminBot from "@/components/admin/AdminBot";
import AdminPermissions from "@/components/admin/AdminPermissions";
import AdminDeletionRequests from "@/components/admin/AdminDeletionRequests";
import AdminCustomization from "@/components/admin/AdminCustomization";
import AdminUserPermissions from "@/components/admin/AdminUserPermissions";
import AdminAnalytics from "@/components/admin/AdminAnalytics";
import AdminUserAccess from "@/components/admin/AdminUserAccess";
import AdminInvoices from "@/components/admin/AdminInvoices";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type AdminTab = "dashboard" | "analytics" | "appointments" | "users" | "services" | "coupons" | "messages" | "bot" | "settings" | "profile" | "permissions" | "deletion-requests" | "customization" | "user-permissions" | "user-access" | "invoices";

interface DashboardStats {
  totalUsers: number;
  totalServices: number;
  activeServices: number;
  totalAppointments: number;
  pendingAppointments: number;
  totalCoupons: number;
  totalMessages: number;
  unreadMessages: number;
  pendingDeletionRequests: number;
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
  const [selectedAppointmentForInvoice, setSelectedAppointmentForInvoice] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({ 
    totalUsers: 0, 
    totalServices: 0, 
    activeServices: 0,
    totalAppointments: 0,
    pendingAppointments: 0,
    totalCoupons: 0,
    totalMessages: 0,
    unreadMessages: 0,
    pendingDeletionRequests: 0,
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, isAdmin, isSuperAdmin, isLoading, signOut, permissions } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Define handleSignOut BEFORE any early returns (hooks must be unconditional)
  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate("/");
  }, [signOut, navigate]);

  // 15 minute idle timeout for auto-logout (must be before early returns)
  useIdleTimeout({
    timeout: 15 * 60 * 1000, // 15 minutes
    onTimeout: handleSignOut,
    enabled: isAdmin,
  });

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (!isLoading && user && !isAdmin) {
      navigate("/admin");
    }
  }, [isAdmin, isLoading, user, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
      fetchNotifications();
    }
  }, [isAdmin, isSuperAdmin, user?.id]);

  // Real-time subscriptions for notifications, appointments, and messages
  useEffect(() => {
    if (!isAdmin || !user?.id) return;

    console.log("Setting up real-time subscriptions...");

    // Subscribe to notifications
    const notificationsChannel = supabase
      .channel('admin-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          console.log("New notification:", payload);
          fetchNotifications();
          const newNotification = payload.new as any;
          if (newNotification?.title) {
            toast({
              title: "🔔 " + newNotification.title,
              description: newNotification.message,
            });
          }
        }
      )
      .subscribe();

    // Subscribe to appointments
    const appointmentsChannel = supabase
      .channel('admin-appointments')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'appointments'
        },
        (payload) => {
          console.log("New appointment:", payload);
          fetchStats();
          toast({
            title: "📅 New Appointment",
            description: "A new appointment has been booked!",
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'appointments'
        },
        (payload) => {
          console.log("Appointment updated:", payload);
          fetchStats();
        }
      )
      .subscribe();

    // Subscribe to contact messages
    const messagesChannel = supabase
      .channel('admin-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'contact_messages'
        },
        (payload) => {
          console.log("New message:", payload);
          fetchStats();
          const newMessage = payload.new as any;
          toast({
            title: "💬 New Message",
            description: newMessage?.source === "chatbot_booking" 
              ? "New guest booking request received!" 
              : "New contact message received!",
          });
        }
      )
      .subscribe();

    // Subscribe to profiles (for new user registrations)
    const profilesChannel = supabase
      .channel('admin-profiles')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log("New user registered:", payload);
          fetchStats();
          toast({
            title: "👤 New User",
            description: "A new user has registered!",
          });
        }
      )
      .subscribe();

    return () => {
      console.log("Cleaning up real-time subscriptions...");
      supabase.removeChannel(notificationsChannel);
      supabase.removeChannel(appointmentsChannel);
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(profilesChannel);
    };
  }, [isAdmin, user?.id, toast]);

  const fetchStats = async () => {
    const [usersRes, servicesRes, appointmentsRes, couponsRes, messagesRes, deletionRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("services").select("id, is_visible"),
      supabase.from("appointments").select("id, status"),
      supabase.from("coupons").select("id", { count: "exact", head: true }),
      // Exclude chatbot booking requests (those should be appointments, not messages)
      supabase.from("contact_messages").select("id, is_read").neq("source", "chatbot_booking"),
      isSuperAdmin ? supabase.from("deletion_requests").select("id, status").eq("status", "pending") : { data: [] },
    ]);

    setStats({
      totalUsers: usersRes.count || 0,
      totalServices: servicesRes.data?.length || 0,
      activeServices: servicesRes.data?.filter(s => s.is_visible).length || 0,
      totalAppointments: appointmentsRes.data?.length || 0,
      pendingAppointments: appointmentsRes.data?.filter(a => a.status === "pending").length || 0,
      totalCoupons: couponsRes.count || 0,
      totalMessages: messagesRes.data?.length || 0,
      unreadMessages: messagesRes.data?.filter(m => !m.is_read).length || 0,
      pendingDeletionRequests: deletionRes.data?.length || 0,
    });
  };

  const fetchNotifications = async () => {
    // For admins, fetch notifications where user_id is null (admin notifications) or matches current user
    // For super admins, also include all admin-targeted notifications
    let query = supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    
    if (isSuperAdmin) {
      // Super admins see all notifications
    } else {
      // Regular admins see their own + null (broadcast) notifications
      query = query.or(`user_id.eq.${user?.id},user_id.is.null`);
    }

    const { data } = await query;

    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
  };

  const markAsRead = async (id: string) => {
    // Optimistically update UI first
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    // Then update database
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
  };

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length > 0) {
      // Optimistically update UI first
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
      
      // Then update database
      await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds);
    }
  };

  const clearAllNotifications = async () => {
    if (notifications.length === 0) return;
    
    const notificationIds = notifications.map(n => n.id);
    
    // Optimistically clear UI
    setNotifications([]);
    setUnreadCount(0);
    
    // Delete from database
    await supabase.from("notifications").delete().in("id", notificationIds);
  };

  const getNotificationRedirect = (notification: Notification): AdminTab | null => {
    const title = notification.title.toLowerCase();
    const message = notification.message.toLowerCase();
    
    if (title.includes("appointment") || message.includes("appointment") || message.includes("booked")) {
      return "appointments";
    }
    if (title.includes("message") || message.includes("message") || message.includes("contact")) {
      return "messages";
    }
    if (title.includes("user") || message.includes("signed up") || message.includes("approval") || message.includes("registered")) {
      return "users";
    }
    if (title.includes("deletion") || message.includes("deletion")) {
      return "deletion-requests";
    }
    return null;
  };

  const handleNotificationClick = async (notification: Notification) => {
    await markAsRead(notification.id);
    const redirect = getNotificationRedirect(notification);
    if (redirect) {
      setActiveTab(redirect);
    }
  };

  const handleNavigateToInvoice = (appointmentId: string) => {
    setSelectedAppointmentForInvoice(appointmentId);
    setActiveTab("invoices");
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


  // Filter tabs based on permissions
  const allTabs = [
    { id: "dashboard" as AdminTab, label: "Dashboard", icon: LayoutDashboard, visible: true },
    { id: "analytics" as AdminTab, label: "Analytics", icon: BarChart3, visible: isSuperAdmin },
    { id: "services" as AdminTab, label: "Services", icon: Briefcase, visible: permissions.can_view_services },
    { id: "appointments" as AdminTab, label: "Appointments", icon: Calendar, visible: permissions.can_view_appointments },
    { id: "invoices" as AdminTab, label: "Invoices", icon: FileText, visible: permissions.can_view_appointments },
    { id: "messages" as AdminTab, label: "Messages", icon: MessageSquare, badge: stats.unreadMessages, visible: permissions.can_view_messages },
    { id: "users" as AdminTab, label: "Users", icon: Users, visible: permissions.can_view_users },
    { id: "coupons" as AdminTab, label: "Coupons", icon: Ticket, visible: permissions.can_view_coupons },
    { id: "user-access" as AdminTab, label: "User Access", icon: Lock, visible: permissions.can_manage_users },
    { id: "bot" as AdminTab, label: "Bot Settings", icon: Bot, visible: permissions.can_view_settings },
    { id: "customization" as AdminTab, label: "Customization", icon: Paintbrush, visible: isSuperAdmin },
    { id: "user-permissions" as AdminTab, label: "User Roles", icon: UserCog, visible: isSuperAdmin },
    { id: "permissions" as AdminTab, label: "Admin Permissions", icon: Shield, visible: isSuperAdmin },
    { id: "deletion-requests" as AdminTab, label: "Deletion Requests", icon: Trash2, badge: stats.pendingDeletionRequests, visible: isSuperAdmin },
    { id: "profile" as AdminTab, label: "My Profile", icon: UserCircle, visible: true },
    { id: "settings" as AdminTab, label: "Settings", icon: Settings, visible: permissions.can_view_settings },
  ];

  const tabs = allTabs.filter(tab => tab.visible);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {permissions.can_view_users && (
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
              )}
              {permissions.can_view_services && (
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
              )}
              {permissions.can_view_appointments && (
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
              )}
              {permissions.can_view_coupons && (
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
              )}
              {permissions.can_view_messages && (
                <div 
                  className="bg-card rounded-xl p-6 border border-border cursor-pointer hover:border-primary transition-colors"
                  onClick={() => setActiveTab("messages")}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-muted-foreground text-sm mb-2">Messages</h3>
                      <p className="text-3xl font-bold text-foreground">{stats.totalMessages}</p>
                      {stats.unreadMessages > 0 && (
                        <p className="text-xs text-yellow-500">{stats.unreadMessages} unread</p>
                      )}
                    </div>
                    <MessageSquare className="w-10 h-10 text-primary/50" />
                  </div>
                </div>
              )}
              {isSuperAdmin && stats.pendingDeletionRequests > 0 && (
                <div 
                  className="bg-card rounded-xl p-6 border border-destructive/50 cursor-pointer hover:border-destructive transition-colors"
                  onClick={() => setActiveTab("deletion-requests")}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-muted-foreground text-sm mb-2">Pending Deletions</h3>
                      <p className="text-3xl font-bold text-destructive">{stats.pendingDeletionRequests}</p>
                      <p className="text-xs text-muted-foreground">awaiting approval</p>
                    </div>
                    <Trash2 className="w-10 h-10 text-destructive/50" />
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case "analytics":
        return isSuperAdmin ? <AdminAnalytics /> : null;
      case "services":
        return <AdminServices />;
      case "appointments":
        return <AdminAppointments onNavigateToInvoice={handleNavigateToInvoice} />;
      case "invoices":
        return <AdminInvoices preSelectedAppointmentId={selectedAppointmentForInvoice} onClearSelection={() => setSelectedAppointmentForInvoice(null)} />;
      case "users":
        return <AdminUsers />;
      case "coupons":
        return <AdminCoupons />;
      case "messages":
        return <AdminMessages />;
      case "bot":
        return <AdminBot />;
      case "user-access":
        return <AdminUserAccess />;
      case "permissions":
        return isSuperAdmin ? <AdminPermissions /> : null;
      case "deletion-requests":
        return isSuperAdmin ? <AdminDeletionRequests /> : null;
      case "customization":
        return isSuperAdmin ? <AdminCustomization /> : null;
      case "user-permissions":
        return isSuperAdmin ? <AdminUserPermissions /> : null;
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
            <h1 className="text-xl font-bold text-foreground">
              {isSuperAdmin ? "Admin Panel" : isAdmin ? "Control Panel" : "User Panel"}
            </h1>
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
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground">
                  {isSuperAdmin ? "Super Admin" : "Admin"}
                </p>
                {isSuperAdmin && <Shield className="w-4 h-4 text-primary" />}
              </div>
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
          <ThemeToggle />
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
                <div className="flex gap-1">
                  {unreadCount > 0 && (
                    <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                      <Check className="w-4 h-4 mr-1" /> Read all
                    </Button>
                  )}
                  {notifications.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearAllNotifications} className="text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-border last:border-0 cursor-pointer hover:bg-muted/50 ${
                        !notification.is_read ? "bg-primary/5" : ""
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <p className="font-medium text-sm">{notification.title}</p>
                      <p className="text-muted-foreground text-xs mt-1">{notification.message}</p>
                      {getNotificationRedirect(notification) && (
                        <p className="text-xs text-primary mt-1">Click to view →</p>
                      )}
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
