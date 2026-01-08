import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Shield, Save, Users } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AdminUser {
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: string;
}

interface Permissions {
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
  can_view_invoices: boolean;
  can_manage_invoices: boolean;
  can_view_technicians: boolean;
  can_manage_technicians: boolean;
  can_view_analytics: boolean;
  can_export_data: boolean;
  can_view_api_keys: boolean;
  can_manage_api_keys: boolean;
  can_view_bot_settings: boolean;
  can_manage_bot_settings: boolean;
  can_view_deletion_requests: boolean;
  can_manage_deletion_requests: boolean;
  can_view_blog: boolean;
  can_manage_blog: boolean;
  can_view_blog_ads: boolean;
  can_manage_blog_ads: boolean;
}

const defaultPermissions: Permissions = {
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
  can_view_invoices: true,
  can_manage_invoices: false,
  can_view_technicians: true,
  can_manage_technicians: false,
  can_view_analytics: true,
  can_export_data: true,
  can_view_api_keys: false,
  can_manage_api_keys: false,
  can_view_bot_settings: true,
  can_manage_bot_settings: false,
  can_view_deletion_requests: true,
  can_manage_deletion_requests: false,
  can_view_blog: true,
  can_manage_blog: false,
  can_view_blog_ads: true,
  can_manage_blog_ads: false,
};

const AdminPermissions = () => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [selectedAdmin, setSelectedAdmin] = useState<string>("");
  const [permissions, setPermissions] = useState<Permissions>(defaultPermissions);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAdmins();
  }, []);

  useEffect(() => {
    if (selectedAdmin) {
      fetchPermissions(selectedAdmin);
    }
  }, [selectedAdmin]);

  const fetchAdmins = async () => {
    setLoading(true);
    
    // Get all admin users (not super_admin)
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .eq("role", "admin");

    if (!roles || roles.length === 0) {
      setAdmins([]);
      setLoading(false);
      return;
    }

    const userIds = roles.map(r => r.user_id);
    
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, email, full_name")
      .in("user_id", userIds);

    const adminUsers = roles.map(r => {
      const profile = profiles?.find(p => p.user_id === r.user_id);
      return {
        user_id: r.user_id,
        email: profile?.email || null,
        full_name: profile?.full_name || null,
        role: r.role,
      };
    });

    setAdmins(adminUsers);
    if (adminUsers.length > 0 && !selectedAdmin) {
      setSelectedAdmin(adminUsers[0].user_id);
    }
    setLoading(false);
  };

  const fetchPermissions = async (userId: string) => {
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
        can_view_invoices: data.can_view_invoices ?? true,
        can_manage_invoices: data.can_manage_invoices ?? false,
        can_view_technicians: data.can_view_technicians ?? true,
        can_manage_technicians: data.can_manage_technicians ?? false,
        can_view_analytics: data.can_view_analytics ?? true,
        can_export_data: data.can_export_data ?? true,
        can_view_api_keys: data.can_view_api_keys ?? false,
        can_manage_api_keys: data.can_manage_api_keys ?? false,
        can_view_bot_settings: data.can_view_bot_settings ?? true,
        can_manage_bot_settings: data.can_manage_bot_settings ?? false,
        can_view_deletion_requests: data.can_view_deletion_requests ?? true,
        can_manage_deletion_requests: data.can_manage_deletion_requests ?? false,
        can_view_blog: data.can_view_blog ?? true,
        can_manage_blog: data.can_manage_blog ?? false,
        can_view_blog_ads: data.can_view_blog_ads ?? true,
        can_manage_blog_ads: data.can_manage_blog_ads ?? false,
      });
    } else {
      setPermissions(defaultPermissions);
    }
  };

  const savePermissions = async () => {
    if (!selectedAdmin) return;

    setSaving(true);

    const { error } = await supabase
      .from("admin_permissions")
      .upsert({
        user_id: selectedAdmin,
        ...permissions,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Permissions updated successfully" });
    }

    setSaving(false);
  };

  const PermissionRow = ({ 
    label, 
    permKey, 
    description 
  }: { 
    label: string; 
    permKey: keyof Permissions; 
    description: string;
  }) => (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div>
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch
        checked={permissions[permKey]}
        onCheckedChange={(checked) => 
          setPermissions(prev => ({ ...prev, [permKey]: checked }))
        }
      />
    </div>
  );

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold text-foreground">Admin Permissions</h2>
      </div>

      <p className="text-muted-foreground">
        Manage what each admin can access and do in the admin panel. Super admins always have full access.
      </p>

      {admins.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Admin Users</h3>
          <p className="text-muted-foreground">
            There are no admin users to manage permissions for. Promote a user to admin role first.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-card rounded-xl border border-border p-6">
            <label className="block text-sm font-medium text-foreground mb-2">
              Select Admin
            </label>
            <Select value={selectedAdmin} onValueChange={setSelectedAdmin}>
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Select an admin" />
              </SelectTrigger>
              <SelectContent>
                {admins.map((admin) => (
                  <SelectItem key={admin.user_id} value={admin.user_id}>
                    {admin.full_name || admin.email || "Unknown"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedAdmin && (
            <div className="bg-card rounded-xl border border-border p-6 space-y-4">
              <h3 className="font-semibold text-lg">Permissions</h3>
              
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Messages</h4>
                <PermissionRow 
                  label="View Messages" 
                  permKey="can_view_messages" 
                  description="Can view contact messages and chat messages"
                />
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Appointments</h4>
                <PermissionRow 
                  label="View Appointments" 
                  permKey="can_view_appointments" 
                  description="Can view all appointments"
                />
                <PermissionRow 
                  label="Confirm Appointments" 
                  permKey="can_confirm_appointments" 
                  description="Can confirm or update appointment status"
                />
                <PermissionRow 
                  label="Delete Appointments" 
                  permKey="can_delete_appointments" 
                  description="Can delete appointments directly (otherwise must request deletion)"
                />
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Users</h4>
                <PermissionRow 
                  label="View Users" 
                  permKey="can_view_users" 
                  description="Can view user list"
                />
                <PermissionRow 
                  label="Manage Users" 
                  permKey="can_manage_users" 
                  description="Can edit, approve, freeze users"
                />
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Services</h4>
                <PermissionRow 
                  label="View Services" 
                  permKey="can_view_services" 
                  description="Can view services"
                />
                <PermissionRow 
                  label="Manage Services" 
                  permKey="can_manage_services" 
                  description="Can add, edit, delete services"
                />
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Coupons</h4>
                <PermissionRow 
                  label="View Coupons" 
                  permKey="can_view_coupons" 
                  description="Can view coupons"
                />
                <PermissionRow 
                  label="Manage Coupons" 
                  permKey="can_manage_coupons" 
                  description="Can add, edit, delete coupons"
                />
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Settings</h4>
                <PermissionRow 
                  label="View Settings" 
                  permKey="can_view_settings" 
                  description="Can view site settings"
                />
                <PermissionRow 
                  label="Manage Settings" 
                  permKey="can_manage_settings" 
                  description="Can modify site settings"
                />
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Invoices</h4>
                <PermissionRow 
                  label="View Invoices" 
                  permKey="can_view_invoices" 
                  description="Can view invoices"
                />
                <PermissionRow 
                  label="Manage Invoices" 
                  permKey="can_manage_invoices" 
                  description="Can create, edit, delete invoices"
                />
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Technicians</h4>
                <PermissionRow 
                  label="View Technicians" 
                  permKey="can_view_technicians" 
                  description="Can view technicians list"
                />
                <PermissionRow 
                  label="Manage Technicians" 
                  permKey="can_manage_technicians" 
                  description="Can add, edit, delete technicians"
                />
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Analytics & Export</h4>
                <PermissionRow 
                  label="View Analytics" 
                  permKey="can_view_analytics" 
                  description="Can view analytics dashboard"
                />
                <PermissionRow 
                  label="Export Data" 
                  permKey="can_export_data" 
                  description="Can export data to Excel, PDF, Word"
                />
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">API Keys</h4>
                <PermissionRow 
                  label="View API Keys" 
                  permKey="can_view_api_keys" 
                  description="Can view API keys (sensitive)"
                />
                <PermissionRow 
                  label="Manage API Keys" 
                  permKey="can_manage_api_keys" 
                  description="Can add, edit, delete API keys"
                />
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Bot Settings</h4>
                <PermissionRow 
                  label="View Bot Settings" 
                  permKey="can_view_bot_settings" 
                  description="Can view chatbot and notification settings"
                />
                <PermissionRow 
                  label="Manage Bot Settings" 
                  permKey="can_manage_bot_settings" 
                  description="Can modify bot and notification settings"
                />
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Deletion Requests</h4>
                <PermissionRow 
                  label="View Deletion Requests" 
                  permKey="can_view_deletion_requests" 
                  description="Can view pending deletion requests"
                />
                <PermissionRow 
                  label="Manage Deletion Requests" 
                  permKey="can_manage_deletion_requests" 
                  description="Can approve or reject deletion requests"
                />
              </div>

              <div className="space-y-1">
                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Blog</h4>
                <PermissionRow 
                  label="View Blog Posts" 
                  permKey="can_view_blog" 
                  description="Can view blog posts and analytics"
                />
                <PermissionRow 
                  label="Manage Blog Posts" 
                  permKey="can_manage_blog" 
                  description="Can add, edit, delete blog posts, categories, and tags"
                />
                <PermissionRow 
                  label="View Blog Ads" 
                  permKey="can_view_blog_ads" 
                  description="Can view blog ad placements"
                />
                <PermissionRow 
                  label="Manage Blog Ads" 
                  permKey="can_manage_blog_ads" 
                  description="Can add, edit, delete blog ads"
                />
              </div>

              <div className="pt-4">
                <Button onClick={savePermissions} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Saving..." : "Save Permissions"}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminPermissions;