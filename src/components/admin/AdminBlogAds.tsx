import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, GripVertical, Code, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableItem } from "@/components/SortableItem";

interface BlogAd {
  id: string;
  title: string;
  ad_code: string;
  placement: string;
  ad_type: string;
  is_active: boolean;
  display_order: number;
  post_id: string | null;
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
}

const AdminBlogAds = () => {
  const [ads, setAds] = useState<BlogAd[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<BlogAd | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    ad_code: "",
    placement: "sidebar",
    ad_type: "custom",
    is_active: true,
    post_id: "" as string | null,
  });
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchAds();
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from("blog_posts")
      .select("id, title, slug")
      .order("title", { ascending: true });
    if (data) setPosts(data);
  };

  const fetchAds = async () => {
    const { data, error } = await supabase
      .from("blog_ads")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      toast({ title: "Error fetching ads", description: error.message, variant: "destructive" });
    } else {
      setAds(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.ad_code) {
      toast({ title: "Title and ad code are required", variant: "destructive" });
      return;
    }

    if (editingAd) {
      const { error } = await supabase
        .from("blog_ads")
        .update(formData)
        .eq("id", editingAd.id);

      if (error) {
        toast({ title: "Error updating ad", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Ad updated successfully" });
        fetchAds();
        setDialogOpen(false);
        resetForm();
      }
    } else {
      const insertData = {
        ...formData,
        post_id: formData.post_id || null,
        display_order: ads.length,
      };
      const { error } = await supabase.from("blog_ads").insert([insertData]);

      if (error) {
        toast({ title: "Error creating ad", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Ad created successfully" });
        fetchAds();
        setDialogOpen(false);
        resetForm();
      }
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("blog_ads").delete().eq("id", id);
    if (error) {
      toast({ title: "Error deleting ad", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Ad deleted successfully" });
      fetchAds();
    }
  };

  const toggleActive = async (ad: BlogAd) => {
    const { error } = await supabase
      .from("blog_ads")
      .update({ is_active: !ad.is_active })
      .eq("id", ad.id);

    if (error) {
      toast({ title: "Error updating ad", description: error.message, variant: "destructive" });
    } else {
      fetchAds();
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = ads.findIndex((a) => a.id === active.id);
    const newIndex = ads.findIndex((a) => a.id === over.id);
    const reordered = arrayMove(ads, oldIndex, newIndex);

    setAds(reordered);

    const updates = reordered.map((ad, index) => ({
      id: ad.id,
      display_order: index,
    }));

    for (const update of updates) {
      await supabase.from("blog_ads").update({ display_order: update.display_order }).eq("id", update.id);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      ad_code: "",
      placement: "sidebar",
      ad_type: "custom",
      is_active: true,
      post_id: "",
    });
    setEditingAd(null);
  };

  const openEditDialog = (ad: BlogAd) => {
    setEditingAd(ad);
    setFormData({
      title: ad.title,
      ad_code: ad.ad_code,
      placement: ad.placement,
      ad_type: ad.ad_type || "custom",
      is_active: ad.is_active,
      post_id: ad.post_id || "",
    });
    setDialogOpen(true);
  };

  const getPostTitle = (postId: string | null) => {
    if (!postId) return "All Posts";
    const post = posts.find((p) => p.id === postId);
    return post ? post.title : "Unknown Post";
  };

  const getPlacementLabel = (placement: string) => {
    switch (placement) {
      case "sidebar": return "Sidebar";
      case "in-content": return "In Content";
      case "header": return "Header";
      case "footer": return "Footer";
      default: return placement;
    }
  };

  const getAdTypeLabel = (adType: string) => {
    switch (adType) {
      case "adsense": return "Google AdSense";
      case "adsterra": return "Adsterra";
      case "custom": return "Custom HTML";
      default: return adType;
    }
  };

  const getAdTypeColor = (adType: string) => {
    switch (adType) {
      case "adsense": return "bg-blue-500/20 text-blue-500";
      case "adsterra": return "bg-orange-500/20 text-orange-500";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Blog Ads</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage ads for your blog - supports AdSense, Adsterra, and custom HTML
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Add Ad</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingAd ? "Edit Ad" : "Add New Ad"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ad title (for reference)"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Ad Network</Label>
                  <Select
                    value={formData.ad_type}
                    onValueChange={(value) => setFormData({ ...formData, ad_type: value })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="adsense">Google AdSense</SelectItem>
                      <SelectItem value="adsterra">Adsterra</SelectItem>
                      <SelectItem value="custom">Custom HTML/JS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Placement</Label>
                  <Select
                    value={formData.placement}
                    onValueChange={(value) => setFormData({ ...formData, placement: value })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sidebar">Sidebar</SelectItem>
                      <SelectItem value="in-content">In Content (between paragraphs)</SelectItem>
                      <SelectItem value="header">Header (top of post)</SelectItem>
                      <SelectItem value="footer">Footer (bottom of post)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Show on Post (optional)</Label>
                <Select
                  value={formData.post_id || "all"}
                  onValueChange={(value) => setFormData({ ...formData, post_id: value === "all" ? "" : value })}
                >
                  <SelectTrigger><SelectValue placeholder="All Posts" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Posts (Global)</SelectItem>
                    {posts.map((post) => (
                      <SelectItem key={post.id} value={post.id}>{post.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Leave as "All Posts" to show on every blog post, or select a specific post.
                </p>
              </div>

              {formData.ad_type === "adsense" && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Paste your Google AdSense code below. Make sure you have added your site to AdSense and it is approved.
                    Example: <code className="text-xs">&lt;ins class="adsbygoogle" data-ad-client="ca-pub-xxx" ...&gt;&lt;/ins&gt;</code>
                  </AlertDescription>
                </Alert>
              )}

              {formData.ad_type === "adsterra" && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Paste your Adsterra ad code below. You can get this from your Adsterra dashboard under Websites → Get Code.
                    Both banner and native ads are supported.
                  </AlertDescription>
                </Alert>
              )}

              <div>
                <Label>Ad Code * (HTML/JavaScript)</Label>
                <Textarea
                  value={formData.ad_code}
                  onChange={(e) => setFormData({ ...formData, ad_code: e.target.value })}
                  placeholder={
                    formData.ad_type === "adsense"
                      ? "<!-- Paste your AdSense code here -->\n<ins class=\"adsbygoogle\"\n  style=\"display:block\"\n  data-ad-client=\"ca-pub-XXXXXXX\"\n  data-ad-slot=\"XXXXXXX\"\n  data-ad-format=\"auto\"></ins>\n<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>"
                      : formData.ad_type === "adsterra"
                        ? "<!-- Paste your Adsterra code here -->\n<script type=\"text/javascript\">\n  atOptions = { 'key' : 'xxx', 'format' : 'iframe', ... };\n</script>\n<script src=\"//www.xxx.com/xxx/invoke.js\"></script>"
                        : "Paste your ad code here (HTML/JavaScript)"
                  }
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label>Active</Label>
              </div>
              <Button onClick={handleSubmit} className="w-full">
                {editingAd ? "Update Ad" : "Add Ad"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading ads...</div>
      ) : ads.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No ads configured. Add your first ad slot!
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={ads.map((a) => a.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {ads.map((ad) => (
                <SortableItem key={ad.id} id={ad.id}>
                  <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
                    <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab" />
                    <Code className="w-5 h-5 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground">{ad.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getAdTypeColor(ad.ad_type)}`}>
                          {getAdTypeLabel(ad.ad_type)}
                        </span>
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                          {getPlacementLabel(ad.placement)}
                        </span>
                        {ad.is_active ? (
                          <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full">Active</span>
                        ) : (
                          <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Inactive</span>
                        )}
                        <span className="text-xs bg-purple-500/20 text-purple-500 px-2 py-0.5 rounded-full">
                          {getPostTitle(ad.post_id)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground font-mono truncate max-w-md mt-1">
                        {ad.ad_code.substring(0, 60)}...
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={ad.is_active} onCheckedChange={() => toggleActive(ad)} />
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(ad)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Ad</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{ad.title}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(ad.id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </SortableItem>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};

export default AdminBlogAds;