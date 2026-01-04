import { useState, useEffect, useCallback, useRef } from "react";
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
  Globe,
  Lock,
  FileText,
  Wrench,
  Key,
  ShieldAlert,
  FolderOpen,
  UserCheck,
  Newspaper,
  Star,
  Megaphone
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
import AdminTechnicians from "@/components/admin/AdminTechnicians";
import AdminApiKeys from "@/components/admin/AdminApiKeys";
import AdminServiceProjects from "@/components/admin/AdminServiceProjects";
import TrafficAnalytics from "@/components/admin/TrafficAnalytics";
import AdminTeamMembers from "@/components/admin/AdminTeamMembers";
import AdminBlog from "@/components/admin/AdminBlog";
import AdminBlogAds from "@/components/admin/AdminBlogAds";
import AdminTestimonials from "@/components/admin/AdminTestimonials";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type AdminTab = "dashboard" | "analytics" | "traffic" | "appointments" | "users" | "services" | "service-projects" | "coupons" | "messages" | "bot" | "settings" | "profile" | "permissions" | "deletion-requests" | "customization" | "user-permissions" | "user-access" | "invoices" | "technicians" | "api-keys" | "team-members" | "blog" | "blog-ads" | "testimonials";

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

interface PendingAppointment {
  id: string;
  reference_id: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  service_name: string | null;
  user_name: string | null;
}

interface RecentMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  is_read: boolean;
  created_at: string;
  source: string | null;
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
  const [pendingAppointmentsList, setPendingAppointmentsList] = useState<PendingAppointment[]>([]);
  const [recentMessages, setRecentMessages] = useState<RecentMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const shownNotificationIdsRef = useRef<Set<string>>(new Set());
  const [accessDeniedOpen, setAccessDeniedOpen] = useState(false);
  const { user, isAdmin, isSuperAdmin, isLoading, signOut, permissions } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Define handleSignOut BEFORE any early returns (hooks must be unconditional)
  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate("/");
  }, [signOut, navigate]);

  // Idle timeout for auto-logout (configurable from settings)
  const [idleTimeoutMinutes, setIdleTimeoutMinutes] = useState<number>(15);
  
  useEffect(() => {
    const fetchIdleTimeout = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "idle_timeout_minutes")
        .single();
      if (data?.value) {
        setIdleTimeoutMinutes(parseInt(data.value) || 15);
      }
    };
    fetchIdleTimeout();
  }, []);

  useIdleTimeout({
    timeout: idleTimeoutMinutes * 60 * 1000,
    onTimeout: handleSignOut,
    enabled: !!user,
  });

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (!isLoading && user && !isAdmin) {
      setAccessDeniedOpen(true);
    }
  }, [isAdmin, isLoading, user]);

  useEffect(() => {
    if (isAdmin) {
      fetchStats();
      fetchNotifications();
      fetchPendingAppointments();
      fetchRecentMessages();
    }
  }, [isAdmin, isSuperAdmin, user?.id]);

  // Real-time subscriptions for notifications, appointments, and messages
  useEffect(() => {
    if (!isAdmin || !user?.id) return;

     console.log("Setting up real-time subscriptions...");

     // Subscribe to notifications (admin area should only show admin/broadcast + this admin's own)
     const notificationsChannel = supabase
      .channel("admin-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        (payload) => {
          console.log("New notification:", payload);
          const newNotification = payload.new as any;

          // Filter out user-specific notifications (customers) for the admin notification center.
          // Keep broadcast (user_id null) and notifications targeted to this admin.
          const isVisibleToThisAdmin =
            newNotification?.user_id == null || newNotification?.user_id === user?.id;
          if (!isVisibleToThisAdmin) return;

          // Only show toast if we haven't shown this notification yet
          if (
            newNotification?.id &&
            !shownNotificationIdsRef.current.has(newNotification.id)
          ) {
            shownNotificationIdsRef.current.add(newNotification.id);

            // Add to state directly instead of refetching to avoid race conditions
            setNotifications((prev) => {
              if (prev.some((n) => n.id === newNotification.id)) return prev;
              return [newNotification, ...prev].slice(0, 20);
            });
            setUnreadCount((prev) => prev + 1);

            if (newNotification?.title) {
              toast({
                title: "🔔 " + newNotification.title,
                description: newNotification.message,
              });
            }
          }
        }
      )
      .subscribe();

    // Subscribe to appointments (don't show toast - notification trigger handles it)
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
          fetchPendingAppointments();
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
          fetchPendingAppointments();
        }
      )
      .subscribe();

    // Subscribe to contact messages (don't show toast - use notifications table)
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
          fetchRecentMessages();
        }
      )
      .subscribe();

    // Subscribe to profiles (don't show toast - notification trigger handles it)
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
    const [
      usersRes,
      servicesRes,
      appointmentsTotalRes,
      appointmentsPendingRes,
      couponsRes,
      messagesTotalRes,
      messagesUnreadRes,
      deletionRes,
    ] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("services").select("id, is_visible"),
      supabase.from("appointments").select("id", { count: "exact", head: true }),
      supabase.from("appointments").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("coupons").select("id", { count: "exact", head: true }),
      // Exclude chatbot booking requests (those should be appointments, not messages)
      supabase.from("contact_messages").select("id", { count: "exact", head: true }).neq("source", "chatbot_booking"),
      supabase.from("contact_messages").select("id", { count: "exact", head: true }).neq("source", "chatbot_booking").eq("is_read", false),
      isSuperAdmin
        ? supabase.from("deletion_requests").select("id", { count: "exact", head: true }).eq("status", "pending")
        : ({ data: [], count: 0 } as any),
    ]);

    const errors = [
      usersRes.error,
      servicesRes.error,
      appointmentsTotalRes.error,
      appointmentsPendingRes.error,
      couponsRes.error,
      messagesTotalRes.error,
      messagesUnreadRes.error,
      (deletionRes as any).error,
    ].filter(Boolean);

    if (errors.length) {
      console.error("Error fetching dashboard stats:", errors);
      toast({
        title: "Stats error",
        description: "Some dashboard stats could not be loaded. Please refresh.",
        variant: "destructive",
      });
    }

    setStats({
      totalUsers: usersRes.count || 0,
      totalServices: servicesRes.data?.length || 0,
      activeServices: servicesRes.data?.filter((s) => s.is_visible).length || 0,
      totalAppointments: appointmentsTotalRes.count || 0,
      pendingAppointments: appointmentsPendingRes.count || 0,
      totalCoupons: couponsRes.count || 0,
      totalMessages: messagesTotalRes.count || 0,
      unreadMessages: messagesUnreadRes.count || 0,
      pendingDeletionRequests: (deletionRes as any).count || 0,
    });
  };

  const fetchPendingAppointments = async () => {
    const { data } = await supabase
      .from("appointments")
      .select(`
        id,
        reference_id,
        appointment_date,
        appointment_time,
        status,
        services(name),
        profiles!appointments_user_id_fkey(full_name)
      `)
      .eq("status", "pending")
      .order("appointment_date", { ascending: true })
      .limit(5);

    if (data) {
      const formatted = data.map((apt: any) => ({
        id: apt.id,
        reference_id: apt.reference_id,
        appointment_date: apt.appointment_date,
        appointment_time: apt.appointment_time,
        status: apt.status,
        service_name: apt.services?.name || null,
        user_name: apt.profiles?.full_name || null,
      }));
      setPendingAppointmentsList(formatted);
    }
  };

  const fetchRecentMessages = async () => {
    const { data } = await supabase
      .from("contact_messages")
      .select("id, name, email, message, is_read, created_at, source")
      .neq("source", "chatbot_booking")
      .order("created_at", { ascending: false })
      .limit(5);

    if (data) {
      setRecentMessages(data);
    }
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
    return (
      <AlertDialog open={accessDeniedOpen} onOpenChange={setAccessDeniedOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <ShieldAlert className="w-8 h-8 text-destructive" />
            </div>
            <AlertDialogTitle className="text-center">Access Restricted</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              You don't have permission to access the admin panel. Please contact your administrator if you believe this is an error.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogAction onClick={() => {
              setAccessDeniedOpen(false);
              navigate("/dashboard");
            }}>
              Go to Dashboard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }


  // Filter tabs based on permissions
  const allTabs = [
    { id: "dashboard" as AdminTab, label: "Dashboard", icon: LayoutDashboard, visible: true },
    { id: "analytics" as AdminTab, label: "Analytics", icon: BarChart3, visible: isSuperAdmin },
    { id: "traffic" as AdminTab, label: "Traffic", icon: Globe, visible: isSuperAdmin },
    { id: "services" as AdminTab, label: "Services", icon: Briefcase, visible: permissions.can_view_services },
    { id: "service-projects" as AdminTab, label: "Service Projects", icon: FolderOpen, visible: permissions.can_view_services },
    { id: "appointments" as AdminTab, label: "Appointments", icon: Calendar, visible: permissions.can_view_appointments },
    { id: "invoices" as AdminTab, label: "Invoices", icon: FileText, visible: permissions.can_view_appointments },
    { id: "technicians" as AdminTab, label: "Technicians", icon: Wrench, visible: permissions.can_view_appointments },
    { id: "messages" as AdminTab, label: "Messages", icon: MessageSquare, badge: stats.unreadMessages > 0 ? stats.unreadMessages : undefined, visible: permissions.can_view_messages },
    { id: "users" as AdminTab, label: "Users", icon: Users, visible: permissions.can_view_users },
    { id: "coupons" as AdminTab, label: "Coupons", icon: Ticket, visible: permissions.can_view_coupons },
    { id: "user-access" as AdminTab, label: "User Access", icon: Lock, visible: permissions.can_manage_users },
    { id: "blog" as AdminTab, label: "Blog Posts", icon: Newspaper, visible: isSuperAdmin },
    { id: "blog-ads" as AdminTab, label: "Blog Ads", icon: Megaphone, visible: isSuperAdmin },
    { id: "testimonials" as AdminTab, label: "Testimonials", icon: Star, visible: isSuperAdmin },
    { id: "bot" as AdminTab, label: "Bot Settings", icon: Bot, visible: permissions.can_view_settings },
    { id: "customization" as AdminTab, label: "Website Customization", icon: Paintbrush, visible: isSuperAdmin },
    { id: "team-members" as AdminTab, label: "Team Members", icon: UserCheck, visible: isSuperAdmin },
    { id: "user-permissions" as AdminTab, label: "User Roles", icon: UserCog, visible: isSuperAdmin },
    { id: "permissions" as AdminTab, label: "Admin Permissions", icon: Shield, visible: isSuperAdmin },
    { id: "api-keys" as AdminTab, label: "API Keys", icon: Key, visible: isSuperAdmin },
    { id: "deletion-requests" as AdminTab, label: "Deletion Requests", icon: Trash2, badge: stats.pendingDeletionRequests > 0 ? stats.pendingDeletionRequests : undefined, visible: isSuperAdmin },
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

            {/* Pending Appointments Preview */}
            {permissions.can_view_appointments && pendingAppointmentsList.length > 0 && (
              <div className="bg-card rounded-xl border border-border">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-yellow-500" />
                    <h3 className="font-semibold text-foreground">Pending Appointments</h3>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab("appointments")}>
                    View All
                  </Button>
                </div>
                <div className="divide-y divide-border">
                  {pendingAppointmentsList.map((apt) => (
                    <div 
                      key={apt.id} 
                      className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => setActiveTab("appointments")}
                    >
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{apt.reference_id}</span>
                            <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full">Pending</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {apt.user_name || "Guest"} - {apt.service_name || "Service"}
                          </p>
                        </div>
                        <div className="text-right text-sm">
                          <p className="text-foreground">{new Date(apt.appointment_date).toLocaleDateString()}</p>
                          <p className="text-muted-foreground">{apt.appointment_time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Messages Preview */}
            {permissions.can_view_messages && recentMessages.length > 0 && (
              <div className="bg-card rounded-xl border border-border">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-foreground">Recent Messages</h3>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab("messages")}>
                    View All
                  </Button>
                </div>
                <div className="divide-y divide-border">
                  {recentMessages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => setActiveTab("messages")}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{msg.name}</span>
                            {!msg.is_read && (
                              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">New</span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{msg.message}</p>
                        </div>
                        <p className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(msg.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      case "analytics":
        return isSuperAdmin ? <AdminAnalytics /> : null;
      case "traffic":
        return isSuperAdmin ? <TrafficAnalytics /> : null;
      case "services":
        return <AdminServices />;
      case "service-projects":
        return <AdminServiceProjects />;
      case "appointments":
        return <AdminAppointments onNavigateToInvoice={handleNavigateToInvoice} />;
      case "invoices":
        return <AdminInvoices preSelectedAppointmentId={selectedAppointmentForInvoice} onClearSelection={() => setSelectedAppointmentForInvoice(null)} isSuperAdmin={isSuperAdmin} />;
      case "technicians":
        return <AdminTechnicians />;
      case "api-keys":
        return <AdminApiKeys isSuperAdmin={isSuperAdmin} />;
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
      case "team-members":
        return isSuperAdmin ? <AdminTeamMembers /> : null;
      case "blog":
        return isSuperAdmin ? <AdminBlog /> : null;
      case "blog-ads":
        return isSuperAdmin ? <AdminBlogAds /> : null;
      case "testimonials":
        return isSuperAdmin ? <AdminTestimonials /> : null;
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
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-card border-r border-border transform transition-transform duration-300 flex flex-col h-screen ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-6 border-b border-border flex-shrink-0">
          <h1 className="text-xl font-bold text-foreground">
            {isSuperAdmin ? "Admin Panel" : isAdmin ? "Control Panel" : "User Panel"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Krishna Tech Solutions</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
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

        <div className="p-4 border-t border-border flex-shrink-0">
          <div className="px-4">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-foreground">
                {isSuperAdmin ? "Super Admin" : "Admin"}
              </p>
              {isSuperAdmin && <Shield className="w-4 h-4 text-primary" />}
            </div>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
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
        <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-end gap-3">
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
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
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
