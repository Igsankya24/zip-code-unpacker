import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Settings, RefreshCw, Save, Calendar, Eye, MessageSquare, Ticket, Phone, Bell, FileText, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface UserWithAccess {
  user_id: string;
  email: string | null;
  full_name: string | null;
  is_approved: boolean | null;
  access: {
    can_book_appointments: boolean;
    can_view_services: boolean;
    can_use_chatbot: boolean;
    can_apply_coupons: boolean;
    can_contact_support: boolean;
    can_view_invoices: boolean;
    can_track_appointments: boolean;
    can_receive_notifications: boolean;
    can_update_profile: boolean;
    notes: string | null;
  } | null;
}

const defaultAccess = {
  can_book_appointments: true,
  can_view_services: true,
  can_use_chatbot: true,
  can_apply_coupons: true,
  can_contact_support: true,
  can_view_invoices: true,
  can_track_appointments: true,
  can_receive_notifications: true,
  can_update_profile: true,
  notes: null,
};

const AdminUserAccess = () => {
  const [users, setUsers] = useState<UserWithAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserWithAccess | null>(null);
  const [editAccess, setEditAccess] = useState(defaultAccess);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchUsersWithAccess();
  }, []);

  const fetchUsersWithAccess = async () => {
    setLoading(true);

    // Fetch profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, email, full_name, is_approved")
      .order("created_at", { ascending: false });

    if (profilesError) {
      toast({ title: "Error", description: "Failed to fetch users", variant: "destructive" });
      setLoading(false);
      return;
    }

    // Fetch user access
    const { data: accessData } = await supabase.from("user_access").select("*");

    // Combine
    const usersWithAccess: UserWithAccess[] = profiles?.map((profile) => {
      const userAccess = accessData?.find((a) => a.user_id === profile.user_id);
      return {
        ...profile,
        access: userAccess
          ? {
              can_book_appointments: userAccess.can_book_appointments ?? true,
              can_view_services: userAccess.can_view_services ?? true,
              can_use_chatbot: userAccess.can_use_chatbot ?? true,
              can_apply_coupons: userAccess.can_apply_coupons ?? true,
              can_contact_support: userAccess.can_contact_support ?? true,
              can_view_invoices: userAccess.can_view_invoices ?? true,
              can_track_appointments: userAccess.can_track_appointments ?? true,
              can_receive_notifications: userAccess.can_receive_notifications ?? true,
              can_update_profile: userAccess.can_update_profile ?? true,
              notes: userAccess.notes,
            }
          : null,
      };
    }) || [];

    setUsers(usersWithAccess);
    setLoading(false);
  };

  const handleEditAccess = (user: UserWithAccess) => {
    setSelectedUser(user);
    setEditAccess(user.access || defaultAccess);
    setDialogOpen(true);
  };

  const handleSaveAccess = async () => {
    if (!selectedUser) return;

    setSaving(true);

    const { error } = await supabase
      .from("user_access")
      .upsert(
        {
          user_id: selectedUser.user_id,
          ...editAccess,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (error) {
      toast({ title: "Error", description: "Failed to update access", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "User access updated" });
      setDialogOpen(false);
      fetchUsersWithAccess();
    }

    setSaving(false);
  };

  const getAccessCount = (access: UserWithAccess["access"]) => {
    if (!access) return 9; // All enabled by default
    return [
      access.can_book_appointments,
      access.can_view_services,
      access.can_use_chatbot,
      access.can_apply_coupons,
      access.can_contact_support,
      access.can_view_invoices,
      access.can_track_appointments,
      access.can_receive_notifications,
      access.can_update_profile,
    ].filter(Boolean).length;
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">User Access Control</h2>
          <p className="text-muted-foreground">Control what features each user can access</p>
        </div>
        <Button variant="outline" onClick={fetchUsersWithAccess}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Legend */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <h3 className="text-sm font-medium mb-3">Access Features</h3>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>Book Appointments</span>
          </div>
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <span>View Services</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            <span>Use Chatbot</span>
          </div>
          <div className="flex items-center gap-2">
            <Ticket className="w-4 h-4" />
            <span>Apply Coupons</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            <span>Contact Support</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span>View Invoices</span>
          </div>
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            <span>Track Appointments</span>
          </div>
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span>Receive Notifications</span>
          </div>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span>Update Profile</span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Users Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Access</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.user_id}>
                  <TableCell className="font-medium">{user.full_name || "No Name"}</TableCell>
                  <TableCell>{user.email || "No Email"}</TableCell>
                  <TableCell>
                    <Badge variant={getAccessCount(user.access) === 9 ? "default" : "secondary"}>
                      {getAccessCount(user.access)}/9 features
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {user.is_approved ? (
                      <Badge variant="outline" className="bg-green-500/10 text-green-500">
                        Approved
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500">
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEditAccess(user)}>
                      <Settings className="w-4 h-4 mr-1" />
                      Manage Access
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Access Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage User Access</DialogTitle>
            <DialogDescription>
              Control what {selectedUser?.full_name || selectedUser?.email} can do
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Book Appointments
                </Label>
                <p className="text-xs text-muted-foreground">Can book new appointments</p>
              </div>
              <Switch
                checked={editAccess.can_book_appointments}
                onCheckedChange={(checked) =>
                  setEditAccess({ ...editAccess, can_book_appointments: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  View Services
                </Label>
                <p className="text-xs text-muted-foreground">Can view service listings</p>
              </div>
              <Switch
                checked={editAccess.can_view_services}
                onCheckedChange={(checked) =>
                  setEditAccess({ ...editAccess, can_view_services: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Use Chatbot
                </Label>
                <p className="text-xs text-muted-foreground">Can interact with chatbot</p>
              </div>
              <Switch
                checked={editAccess.can_use_chatbot}
                onCheckedChange={(checked) =>
                  setEditAccess({ ...editAccess, can_use_chatbot: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Ticket className="w-4 h-4" />
                  Apply Coupons
                </Label>
                <p className="text-xs text-muted-foreground">Can use discount coupons</p>
              </div>
              <Switch
                checked={editAccess.can_apply_coupons}
                onCheckedChange={(checked) =>
                  setEditAccess({ ...editAccess, can_apply_coupons: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Contact Support
                </Label>
                <p className="text-xs text-muted-foreground">Can send contact messages</p>
              </div>
              <Switch
                checked={editAccess.can_contact_support}
                onCheckedChange={(checked) =>
                  setEditAccess({ ...editAccess, can_contact_support: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  View Invoices
                </Label>
                <p className="text-xs text-muted-foreground">Can view their invoices</p>
              </div>
              <Switch
                checked={editAccess.can_view_invoices}
                onCheckedChange={(checked) =>
                  setEditAccess({ ...editAccess, can_view_invoices: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Track Appointments
                </Label>
                <p className="text-xs text-muted-foreground">Can track appointment status</p>
              </div>
              <Switch
                checked={editAccess.can_track_appointments}
                onCheckedChange={(checked) =>
                  setEditAccess({ ...editAccess, can_track_appointments: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Receive Notifications
                </Label>
                <p className="text-xs text-muted-foreground">Can receive email/SMS notifications</p>
              </div>
              <Switch
                checked={editAccess.can_receive_notifications}
                onCheckedChange={(checked) =>
                  setEditAccess({ ...editAccess, can_receive_notifications: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Update Profile
                </Label>
                <p className="text-xs text-muted-foreground">Can update their profile</p>
              </div>
              <Switch
                checked={editAccess.can_update_profile}
                onCheckedChange={(checked) =>
                  setEditAccess({ ...editAccess, can_update_profile: checked })
                }
              />
            </div>

            <div className="space-y-2 pt-2">
              <Label>Admin Notes</Label>
              <Textarea
                value={editAccess.notes || ""}
                onChange={(e) => setEditAccess({ ...editAccess, notes: e.target.value })}
                placeholder="Optional notes about this user's access..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAccess} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUserAccess;
