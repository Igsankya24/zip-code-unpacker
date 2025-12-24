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