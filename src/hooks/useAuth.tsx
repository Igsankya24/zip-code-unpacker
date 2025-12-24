import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export interface AdminPermissions {
  can_view_messages: boolean;
  can_view_appointments: boolean;
  can_confirm_appointments: boolean;
  can_delete_appointments: boolean;
  can_view_users: boolean;
  can_manage_users: boolean;
  can_view_services: boolean;
  can_manage_services: boolean;
  can_view_coupons: boolean;
  can_manage_coupons: boolean;
  can_view_settings: boolean;
  can_manage_settings: boolean;
}

const defaultPermissions: AdminPermissions = {
  can_view_messages: true,
  can_view_appointments: true,
  can_confirm_appointments: true,
  can_delete_appointments: false,
  can_view_users: true,
  can_manage_users: false,
  can_view_services: true,
  can_manage_services: false,
  can_view_coupons: true,
  can_manage_coupons: false,
  can_view_settings: false,
  can_manage_settings: false,
};

const superAdminPermissions: AdminPermissions = {
  can_view_messages: true,
  can_view_appointments: true,
  can_confirm_appointments: true,
  can_delete_appointments: true,
  can_view_users: true,
  can_manage_users: true,
  can_view_services: true,
  can_manage_services: true,
  can_view_coupons: true,
  can_manage_coupons: true,
  can_view_settings: true,
  can_manage_settings: true,
};

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isApproved: boolean;
  isLoading: boolean;
  permissions: AdminPermissions;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshPermissions: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permissions, setPermissions] = useState<AdminPermissions>(defaultPermissions);

  const checkAdminRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (error) {
        console.error("Error checking admin role:", error);
        return { isAdmin: false, isSuperAdmin: false };
      }

      const roles = data?.map(r => r.role) || [];
      return {
        isAdmin: roles.includes("admin") || roles.includes("super_admin"),
        isSuperAdmin: roles.includes("super_admin")
      };
    } catch (err) {
      console.error("Error in checkAdminRole:", err);
      return { isAdmin: false, isSuperAdmin: false };
    }
  };

  const checkApprovalStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("is_approved")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error checking approval status:", error);
        return false;
      }
      return data?.is_approved ?? false;
    } catch (err) {
      console.error("Error in checkApprovalStatus:", err);
      return false;
    }
  };

  const fetchPermissions = async (userId: string, isSuperAdminUser: boolean) => {
    if (isSuperAdminUser) {
      setPermissions(superAdminPermissions);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("admin_permissions")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching permissions:", error);
        setPermissions(defaultPermissions);
        return;
      }

      if (data) {
        setPermissions({
          can_view_messages: data.can_view_messages ?? true,
          can_view_appointments: data.can_view_appointments ?? true,
          can_confirm_appointments: data.can_confirm_appointments ?? true,
          can_delete_appointments: data.can_delete_appointments ?? false,
          can_view_users: data.can_view_users ?? true,
          can_manage_users: data.can_manage_users ?? false,
          can_view_services: data.can_view_services ?? true,
          can_manage_services: data.can_manage_services ?? false,
          can_view_coupons: data.can_view_coupons ?? true,
          can_manage_coupons: data.can_manage_coupons ?? false,
          can_view_settings: data.can_view_settings ?? false,
          can_manage_settings: data.can_manage_settings ?? false,
        });
      } else {
        setPermissions(defaultPermissions);
      }
    } catch (err) {
      console.error("Error in fetchPermissions:", err);
      setPermissions(defaultPermissions);
    }
  };

  const refreshPermissions = async () => {
    if (user) {
      await fetchPermissions(user.id, isSuperAdmin);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(async () => {
            const { isAdmin, isSuperAdmin } = await checkAdminRole(session.user.id);
            setIsAdmin(isAdmin);
            setIsSuperAdmin(isSuperAdmin);
            const approved = await checkApprovalStatus(session.user.id);
            setIsApproved(approved);
            if (isAdmin) {
              await fetchPermissions(session.user.id, isSuperAdmin);
            }
            setIsLoading(false);
          }, 0);
        } else {
          setIsAdmin(false);
          setIsSuperAdmin(false);
          setIsApproved(false);
          setPermissions(defaultPermissions);
          setIsLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        const { isAdmin, isSuperAdmin } = await checkAdminRole(session.user.id);
        setIsAdmin(isAdmin);
        setIsSuperAdmin(isSuperAdmin);
        const approved = await checkApprovalStatus(session.user.id);
        setIsApproved(approved);
        if (isAdmin) {
          await fetchPermissions(session.user.id, isSuperAdmin);
        }
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error && data.user) {
      try {
        await supabase.from("sessions").insert({
          user_id: data.user.id,
          user_agent: navigator.userAgent,
        });
      } catch (sessionError) {
        console.error("Error tracking session:", sessionError);
      }
    }

    return { error: error as Error | null };
  };

  const signOut = async () => {
    if (user) {
      try {
        await supabase
          .from("sessions")
          .update({ is_active: false, logout_at: new Date().toISOString() })
          .eq("user_id", user.id)
          .eq("is_active", true);
      } catch (error) {
        console.error("Error updating session:", error);
      }
    }

    await supabase.auth.signOut();
    setIsAdmin(false);
    setIsSuperAdmin(false);
    setIsApproved(false);
    setPermissions(defaultPermissions);
    navigate("/auth");
  };

  return (
    <AuthContext.Provider
      value={{ user, session, isAdmin, isSuperAdmin, isApproved, isLoading, permissions, signUp, signIn, signOut, refreshPermissions }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
