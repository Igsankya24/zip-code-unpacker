import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { UserCheck, UserX, Search, Edit, X, Save, Camera, Phone, MapPin, Mail, Lock, Unlock, FileSpreadsheet, FileText, File, Download, Trash2, Key, Shield, LogIn, CalendarCheck, Eye } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportToExcel, exportToPDF, exportToWord } from "@/lib/exportUtils";
import { format } from "date-fns";

interface UserProfile {
  id: string;
  user_id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  avatar_url: string | null;
  is_approved: boolean;
  is_frozen: boolean;
  created_at: string;
  role?: string;
  login_count?: number;
  appointment_count?: number;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);
  const [passwordChangeUser, setPasswordChangeUser] = useState<UserProfile | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profilesError) {
      toast({ title: "Error", description: profilesError.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, role");

    // Get session counts per user
    const { data: sessions } = await supabase
      .from("sessions")
      .select("user_id");

    // Get appointment counts per user
    const { data: appointments } = await supabase
      .from("appointments")
      .select("user_id");

    // Count sessions per user
    const sessionCounts: Record<string, number> = {};
    sessions?.forEach((s) => {
      if (s.user_id) {
        sessionCounts[s.user_id] = (sessionCounts[s.user_id] || 0) + 1;
      }
    });

    // Count appointments per user
    const appointmentCounts: Record<string, number> = {};
    appointments?.forEach((a) => {
      if (a.user_id) {
        appointmentCounts[a.user_id] = (appointmentCounts[a.user_id] || 0) + 1;
      }
    });

    const rolesMap: Record<string, string> = {};
    roles?.forEach((r) => {
      if (r.role === "super_admin" || (r.role === "admin" && !rolesMap[r.user_id])) {
        rolesMap[r.user_id] = r.role;
      } else if (!rolesMap[r.user_id]) {
        rolesMap[r.user_id] = r.role;
      }
    });

    const usersWithRoles = profiles?.map((p) => ({
      ...p,
      role: rolesMap[p.user_id] || "user",
      is_frozen: (p as any).is_frozen ?? false,
      login_count: sessionCounts[p.user_id] || 0,
      appointment_count: appointmentCounts[p.user_id] || 0,
    })) || [];

    setUsers(usersWithRoles);
    setLoading(false);
  };

  const toggleFreeze = async (userId: string, currentFrozen: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_frozen: !currentFrozen, updated_at: new Date().toISOString() })
      .eq("user_id", userId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ 
        title: "Success", 
        description: `User account ${currentFrozen ? "unfrozen" : "frozen"}` 
      });
      fetchUsers();
    }
  };

  const handleExport = (type: 'excel' | 'pdf' | 'word') => {
    const exportData = filteredUsers.map(u => ({
      Name: u.full_name || 'No name',
      Email: u.email || '-',
      Phone: u.phone || '-',
      Role: u.role || 'user',
      Status: u.is_approved ? 'Approved' : 'Pending',
      Frozen: u.is_frozen ? 'Yes' : 'No',
      Created: format(new Date(u.created_at), "MMM d, yyyy")
    }));

    const filename = `users_${format(new Date(), 'yyyy-MM-dd')}`;
    
    switch (type) {
      case 'excel':
        exportToExcel(exportData, filename);
        break;
      case 'pdf':
        exportToPDF(exportData, filename, 'Users Report');
        break;
      case 'word':
        exportToWord(exportData, filename, 'Users Report');
        break;
    }
    
    toast({ title: "Success", description: `Exported to ${type.toUpperCase()}` });
  };

  const toggleApproval = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_approved: !currentStatus, updated_at: new Date().toISOString() })
      .eq("user_id", userId);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: `User ${currentStatus ? "unapproved" : "approved"}` });
      fetchUsers();
    }
  };

  const updateRole = async (userId: string, newRole: string) => {
    await supabase.from("user_roles").delete().eq("user_id", userId);

    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role: newRole });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Role updated successfully" });
      fetchUsers();
    }
  };

  const deleteUser = async (user: UserProfile) => {
    if (user.role === "super_admin") {
      toast({ title: "Error", description: "Super Admin accounts cannot be deleted", variant: "destructive" });
      return;
    }

    // Delete profile (this will cascade to related data)
    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("user_id", user.user_id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "User deleted successfully" });
      fetchUsers();
    }
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const changeUserPassword = async () => {
    if (!passwordChangeUser) return;

    if (newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
      return;
    }

    if (newPassword.length < 6) {
      toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setChangingPassword(true);

    try {
      const { data, error } = await supabase.functions.invoke('change-user-password', {
        body: { 
          targetUserId: passwordChangeUser.user_id, 
          newPassword: newPassword 
        }
      });

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else if (data?.error) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      } else {
        toast({ title: "Success", description: "Password changed successfully" });
        setPasswordChangeUser(null);
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to change password';
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    }

    setChangingPassword(false);
  };

  const handleEditSave = async () => {
    if (!editingUser) return;

    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: editingUser.full_name,
        phone: editingUser.phone,
        address: editingUser.address,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", editingUser.user_id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "User updated successfully" });
      fetchUsers();
      setEditingUser(null);
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !editingUser) return;

    const file = e.target.files[0];
    const fileExt = file.name.split(".").pop();
    const fileName = `${editingUser.user_id}/${Date.now()}.${fileExt}`;

    setUploading(true);

    if (editingUser.avatar_url) {
      const oldPath = editingUser.avatar_url.split("/").slice(-2).join("/");
      await supabase.storage.from("avatars").remove([oldPath]);
    }

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      toast({ title: "Error", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("user_id", editingUser.user_id);

    if (updateError) {
      toast({ title: "Error", description: updateError.message, variant: "destructive" });
    } else {
      setEditingUser({ ...editingUser, avatar_url: publicUrl });
      toast({ title: "Success", description: "Avatar updated successfully" });
      fetchUsers();
    }
    setUploading(false);
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-foreground">Users</h2>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleExport('excel')}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Excel (.xlsx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                <FileText className="w-4 h-4 mr-2" />
                PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('word')}>
                <File className="w-4 h-4 mr-2" />
                Word (.doc)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-4 text-left text-sm font-medium">User</th>
                <th className="p-4 text-left text-sm font-medium hidden md:table-cell">Contact</th>
                <th className="p-4 text-left text-sm font-medium hidden lg:table-cell">Activity</th>
                <th className="p-4 text-left text-sm font-medium">Role</th>
                <th className="p-4 text-left text-sm font-medium">Status</th>
                <th className="p-4 text-left text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-t border-border hover:bg-muted/30">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.avatar_url || ""} />
                        <AvatarFallback>{user.full_name?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{user.full_name || "No name"}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 hidden md:table-cell">
                    <div className="text-sm">
                      <p className="text-muted-foreground">{user.phone || "-"}</p>
                      {user.address && (
                        <p className="text-muted-foreground/70 truncate max-w-[150px]">{user.address}</p>
                      )}
                    </div>
                  </td>
                  <td className="p-4 hidden lg:table-cell">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <LogIn className="w-3.5 h-3.5 text-blue-500" />
                        <span className="text-muted-foreground">{user.login_count || 0} logins</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CalendarCheck className="w-3.5 h-3.5 text-green-500" />
                        <span className="text-muted-foreground">{user.appointment_count || 0} appointments</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <Select
                      value={user.role}
                      onValueChange={(value) => updateRole(user.user_id, value)}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium inline-block w-fit ${
                          user.is_approved
                            ? "bg-green-500/10 text-green-500"
                            : "bg-yellow-500/10 text-yellow-500"
                        }`}
                      >
                        {user.is_approved ? "Approved" : "Pending"}
                      </span>
                      {user.is_frozen && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-500 inline-block w-fit">
                          Frozen
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1 flex-wrap">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingUser(user)}
                        title="Edit user"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleApproval(user.user_id, user.is_approved)}
                        title={user.is_approved ? "Unapprove user" : "Approve user"}
                      >
                        {user.is_approved ? (
                          <UserX className="w-4 h-4 text-destructive" />
                        ) : (
                          <UserCheck className="w-4 h-4 text-green-500" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFreeze(user.user_id, user.is_frozen)}
                        title={user.is_frozen ? "Unfreeze account" : "Freeze account"}
                      >
                        {user.is_frozen ? (
                          <Unlock className="w-4 h-4 text-green-500" />
                        ) : (
                          <Lock className="w-4 h-4 text-orange-500" />
                        )}
                      </Button>
                      {user.email && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPasswordChangeUser(user)}
                          title="Change password"
                        >
                          <Key className="w-4 h-4 text-blue-500" />
                        </Button>
                      )}
                      {user.role !== "super_admin" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setUserToDelete(user);
                            setDeleteDialogOpen(true);
                          }}
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      )}
                      {user.role === "super_admin" && (
                        <span className="ml-1" title="Super Admin - Protected">
                          <Shield className="w-4 h-4 text-primary" />
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          {editingUser && (
            <div className="space-y-4">
              {/* Avatar */}
              <div className="flex justify-center">
                <div className="relative">
                  <Avatar className="w-20 h-20">
                    <AvatarImage src={editingUser.avatar_url || ""} />
                    <AvatarFallback className="text-xl">
                      {editingUser.full_name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <label className="absolute bottom-0 right-0 w-7 h-7 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90">
                    <Camera className="w-3.5 h-3.5 text-primary-foreground" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email
                </label>
                <Input value={editingUser.email || ""} disabled className="bg-muted" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <Input
                  value={editingUser.full_name || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Phone className="w-4 h-4" /> Phone
                </label>
                <Input
                  value={editingUser.phone || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Address
                </label>
                <Textarea
                  value={editingUser.address || ""}
                  onChange={(e) => setEditingUser({ ...editingUser, address: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => setEditingUser(null)} className="flex-1">
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleEditSave} disabled={saving} className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {userToDelete?.full_name || userToDelete?.email}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToDelete && deleteUser(userToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Password Dialog */}
      <Dialog open={!!passwordChangeUser} onOpenChange={() => {
        setPasswordChangeUser(null);
        setNewPassword("");
        setConfirmPassword("");
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          {passwordChangeUser && (
            <div className="space-y-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm font-medium">{passwordChangeUser.full_name || 'User'}</p>
                <p className="text-xs text-muted-foreground">{passwordChangeUser.email}</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">New Password</label>
                <Input
                  type="password"
                  placeholder="Enter new password (min 6 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Confirm Password</label>
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              {newPassword && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-sm text-destructive">Passwords do not match</p>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setPasswordChangeUser(null);
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={changeUserPassword}
                  disabled={changingPassword || !newPassword || newPassword !== confirmPassword || newPassword.length < 6}
                >
                  {changingPassword ? "Changing..." : "Change Password"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
