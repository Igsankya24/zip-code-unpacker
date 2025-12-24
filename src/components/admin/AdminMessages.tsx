import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, User, Trash2, Eye, EyeOff, Search, MessageSquare, Calendar } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  source: string | null;
  is_read: boolean | null;
  created_at: string | null;
}

const AdminMessages = () => {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setMessages(data || []);
    }
    setLoading(false);
  };

  const toggleRead = async (id: string, currentStatus: boolean | null) => {
    const { error } = await supabase
      .from("contact_messages")
      .update({ is_read: !currentStatus })
      .eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setMessages(messages.map((m) => (m.id === id ? { ...m, is_read: !currentStatus } : m)));
    }
  };

  const deleteMessage = async (id: string) => {
    const { error } = await supabase.from("contact_messages").delete().eq("id", id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setMessages(messages.filter((m) => m.id !== id));
      toast({ title: "Deleted", description: "Message deleted successfully" });
    }
  };

  const viewMessage = async (message: ContactMessage) => {
    setSelectedMessage(message);
    if (!message.is_read) {
      await toggleRead(message.id, false);
    }
  };

  const filteredMessages = messages.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.message.toLowerCase().includes(searchTerm.toLowerCase());

    if (filter === "unread") return matchesSearch && !m.is_read;
    if (filter === "read") return matchesSearch && m.is_read;
    return matchesSearch;
  });

  const unreadCount = messages.filter((m) => !m.is_read).length;

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Messages</h2>
          <p className="text-muted-foreground">
            {unreadCount} unread message{unreadCount !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search messages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {(["all", "unread", "read"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {/* Messages List */}
      <div className="space-y-3">
        {filteredMessages.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No messages found</p>
          </div>
        ) : (
          filteredMessages.map((message) => (
            <div
              key={message.id}
              className={`bg-card rounded-xl p-4 border transition-colors cursor-pointer hover:bg-muted/50 ${
                message.is_read ? "border-border" : "border-primary/50 bg-primary/5"
              }`}
              onClick={() => viewMessage(message)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {!message.is_read && (
                      <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                    )}
                    <h4 className="font-semibold text-foreground truncate">{message.name}</h4>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {message.source === "chatbot" ? "Chatbot" : message.source === "chatbot_booking" ? "Booking" : "Contact"}
                    </span>
                  </div>
                  {message.subject && (
                    <p className="text-sm font-medium text-foreground mb-1">{message.subject}</p>
                  )}
                  <p className="text-sm text-muted-foreground line-clamp-2">{message.message}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {message.email}
                    </span>
                    {message.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {message.phone}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {message.created_at ? format(new Date(message.created_at), "PPp") : "N/A"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleRead(message.id, message.is_read);
                    }}
                  >
                    {message.is_read ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMessage(message.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Message Detail Dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              {selectedMessage?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4 text-sm">
                <a href={`mailto:${selectedMessage.email}`} className="flex items-center gap-1 text-primary hover:underline">
                  <Mail className="w-4 h-4" />
                  {selectedMessage.email}
                </a>
                {selectedMessage.phone && (
                  <a href={`tel:${selectedMessage.phone}`} className="flex items-center gap-1 text-primary hover:underline">
                    <Phone className="w-4 h-4" />
                    {selectedMessage.phone}
                  </a>
                )}
              </div>
              {selectedMessage.subject && (
                <div>
                  <p className="text-sm text-muted-foreground">Subject</p>
                  <p className="font-medium">{selectedMessage.subject}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Message</p>
                <p className="whitespace-pre-wrap">{selectedMessage.message}</p>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t">
                <span>Source: {selectedMessage.source}</span>
                <span>{selectedMessage.created_at ? format(new Date(selectedMessage.created_at), "PPpp") : "N/A"}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMessages;
