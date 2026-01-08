import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Eye, EyeOff, Image as ImageIcon, X, Tag, Folder } from "lucide-react";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import ImageCropper from "@/components/ImageCropper";
import RichTextEditor from "@/components/RichTextEditor";
import { compressImageFromBlob } from "@/lib/imageCompression";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featured_image: string | null;
  author_name: string;
  is_published: boolean;
  published_at: string | null;
  views_count: number;
  created_at: string;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

interface BlogTag {
  id: string;
  name: string;
  slug: string;
}

const AdminBlog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    featured_image: "",
    author_name: "Admin",
    is_published: false,
    category_id: "",
  });
  const [cropperOpen, setCropperOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>("");
  
  // Category/Tag management
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", description: "" });
  const [newTag, setNewTag] = useState("");
  
  const { toast } = useToast();

  useEffect(() => {
    fetchPosts();
    fetchCategories();
    fetchTags();
  }, []);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({ title: "Error fetching posts", description: error.message, variant: "destructive" });
    } else {
      setPosts(data || []);
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("blog_categories")
      .select("*")
      .order("display_order", { ascending: true });
    if (data) setCategories(data);
  };

  const fetchTags = async () => {
    const { data } = await supabase
      .from("blog_tags")
      .select("*")
      .order("name", { ascending: true });
    if (data) setTags(data);
  };

  const fetchPostTags = async (postId: string) => {
    const { data } = await supabase
      .from("blog_post_tags")
      .select("tag_id")
      .eq("post_id", postId);
    if (data) setSelectedTags(data.map(t => t.tag_id));
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: editingPost ? formData.slug : generateSlug(title),
    });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
        setCropperOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCroppedImage = async (blob: Blob) => {
    try {
      const fileName = `blog-${Date.now()}.webp`;
      const compressedFile = await compressImageFromBlob(blob, fileName);

      const { data, error } = await supabase.storage
        .from("blog-images")
        .upload(fileName, compressedFile);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("blog-images")
        .getPublicUrl(data.path);

      setFormData({ ...formData, featured_image: urlData.publicUrl });
      toast({ title: "Image uploaded successfully" });
    } catch (error: any) {
      toast({ title: "Error uploading image", description: error.message, variant: "destructive" });
    }
    setCropperOpen(false);
    setImageSrc("");
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.content) {
      toast({ title: "Title and content are required", variant: "destructive" });
      return;
    }

    const postData = {
      title: formData.title,
      slug: formData.slug,
      excerpt: formData.excerpt,
      content: formData.content,
      featured_image: formData.featured_image || null,
      author_name: formData.author_name,
      is_published: formData.is_published,
      published_at: formData.is_published ? new Date().toISOString() : null,
      category_id: formData.category_id || null,
    };

    if (editingPost) {
      const { error } = await supabase
        .from("blog_posts")
        .update(postData)
        .eq("id", editingPost.id);

      if (error) {
        toast({ title: "Error updating post", description: error.message, variant: "destructive" });
        return;
      }

      // Update tags
      await supabase.from("blog_post_tags").delete().eq("post_id", editingPost.id);
      if (selectedTags.length > 0) {
        await supabase.from("blog_post_tags").insert(
          selectedTags.map(tagId => ({ post_id: editingPost.id, tag_id: tagId }))
        );
      }

      toast({ title: "Post updated successfully" });
      fetchPosts();
      setDialogOpen(false);
      resetForm();
    } else {
      const { data, error } = await supabase.from("blog_posts").insert([postData]).select().single();

      if (error) {
        toast({ title: "Error creating post", description: error.message, variant: "destructive" });
        return;
      }

      // Add tags
      if (selectedTags.length > 0 && data) {
        await supabase.from("blog_post_tags").insert(
          selectedTags.map(tagId => ({ post_id: data.id, tag_id: tagId }))
        );
      }

      toast({ title: "Post created successfully" });
      fetchPosts();
      setDialogOpen(false);
      resetForm();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);
    if (error) {
      toast({ title: "Error deleting post", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Post deleted successfully" });
      fetchPosts();
    }
  };

  const togglePublish = async (post: BlogPost) => {
    const { error } = await supabase
      .from("blog_posts")
      .update({
        is_published: !post.is_published,
        published_at: !post.is_published ? new Date().toISOString() : null,
      })
      .eq("id", post.id);

    if (error) {
      toast({ title: "Error updating post", description: error.message, variant: "destructive" });
    } else {
      fetchPosts();
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      featured_image: "",
      author_name: "Admin",
      is_published: false,
      category_id: "",
    });
    setSelectedTags([]);
    setEditingPost(null);
  };

  const openEditDialog = async (post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || "",
      content: post.content,
      featured_image: post.featured_image || "",
      author_name: post.author_name,
      is_published: post.is_published,
      category_id: post.category_id || "",
    });
    await fetchPostTags(post.id);
    setDialogOpen(true);
  };

  const addCategory = async () => {
    if (!newCategory.name) return;
    const slug = generateSlug(newCategory.name);
    const { error } = await supabase.from("blog_categories").insert([{
      name: newCategory.name,
      slug,
      description: newCategory.description,
    }]);
    if (error) {
      toast({ title: "Error adding category", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Category added" });
      fetchCategories();
      setNewCategory({ name: "", description: "" });
      setCategoryDialogOpen(false);
    }
  };

  const deleteCategory = async (id: string) => {
    await supabase.from("blog_categories").delete().eq("id", id);
    fetchCategories();
  };

  const addTag = async () => {
    if (!newTag) return;
    const slug = generateSlug(newTag);
    const { error } = await supabase.from("blog_tags").insert([{ name: newTag, slug }]);
    if (error) {
      toast({ title: "Error adding tag", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Tag added" });
      fetchTags();
      setNewTag("");
      setTagDialogOpen(false);
    }
  };

  const deleteTag = async (id: string) => {
    await supabase.from("blog_tags").delete().eq("id", id);
    fetchTags();
  };

  const toggleTagSelection = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId]
    );
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return null;
    return categories.find(c => c.id === categoryId)?.name;
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="posts">
        <TabsList>
          <TabsTrigger value="posts">Posts</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Blog Posts</h2>
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-2" />New Post</Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingPost ? "Edit Post" : "Create New Post"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Title *</Label>
                      <Input value={formData.title} onChange={(e) => handleTitleChange(e.target.value)} placeholder="Enter post title" />
                    </div>
                    <div>
                      <Label>Slug</Label>
                      <Input value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} placeholder="url-friendly-slug" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Author Name</Label>
                      <Input value={formData.author_name} onChange={(e) => setFormData({ ...formData, author_name: e.target.value })} placeholder="Author name" />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                        <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                        <SelectContent>
                          {categories.map(cat => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-2 mt-2 p-3 bg-muted/50 rounded-lg min-h-[48px]">
                      {tags.map(tag => (
                        <Badge
                          key={tag.id}
                          variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => toggleTagSelection(tag.id)}
                        >
                          {tag.name}
                          {selectedTags.includes(tag.id) && <X className="w-3 h-3 ml-1" />}
                        </Badge>
                      ))}
                      {tags.length === 0 && <span className="text-sm text-muted-foreground">No tags available. Create some in the Tags tab.</span>}
                    </div>
                  </div>
                  <div>
                    <Label>Excerpt</Label>
                    <Textarea value={formData.excerpt} onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })} placeholder="Brief description for preview" rows={2} />
                  </div>
                  <div>
                    <Label>Content * (Rich Text Editor)</Label>
                    <RichTextEditor content={formData.content} onChange={(content) => setFormData({ ...formData, content })} />
                  </div>
                  <div>
                    <Label>Featured Image</Label>
                    <div className="flex items-center gap-4 mt-2">
                      {formData.featured_image && <img src={formData.featured_image} alt="Featured" className="w-32 h-20 object-cover rounded-lg" />}
                      <div>
                        <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" id="featured-image-upload" />
                        <label htmlFor="featured-image-upload">
                          <Button variant="outline" asChild><span><ImageIcon className="w-4 h-4 mr-2" />{formData.featured_image ? "Change Image" : "Upload Image"}</span></Button>
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={formData.is_published} onCheckedChange={(checked) => setFormData({ ...formData, is_published: checked })} />
                    <Label>Publish immediately</Label>
                  </div>
                  <Button onClick={handleSubmit} className="w-full">{editingPost ? "Update Post" : "Create Post"}</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading posts...</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No blog posts yet. Create your first one!</div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
                  {post.featured_image && <img src={post.featured_image} alt={post.title} className="w-24 h-16 object-cover rounded-lg flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground truncate">{post.title}</h3>
                      {post.is_published ? (
                        <span className="text-xs bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full">Published</span>
                      ) : (
                        <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full">Draft</span>
                      )}
                      {getCategoryName(post.category_id) && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">{getCategoryName(post.category_id)}</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{post.excerpt || "No excerpt"}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      By {post.author_name} • <Eye className="w-3 h-3 inline" /> {post.views_count} views • {new Date(post.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => togglePublish(post)} title={post.is_published ? "Unpublish" : "Publish"}>
                      {post.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(post)}><Pencil className="w-4 h-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Post</AlertDialogTitle>
                          <AlertDialogDescription>Are you sure you want to delete "{post.title}"? This action cannot be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(post.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Categories</h2>
            <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
              <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Add Category</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Category</DialogTitle></DialogHeader>
                <div className="space-y-4 mt-4">
                  <div><Label>Name *</Label><Input value={newCategory.name} onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} placeholder="Category name" /></div>
                  <div><Label>Description</Label><Textarea value={newCategory.description} onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })} placeholder="Brief description" /></div>
                  <Button onClick={addCategory} className="w-full">Add Category</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(cat => (
              <div key={cat.id} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2"><Folder className="w-4 h-4 text-primary" /><h3 className="font-semibold text-foreground">{cat.name}</h3></div>
                  {cat.description && <p className="text-sm text-muted-foreground mt-1">{cat.description}</p>}
                </div>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteCategory(cat.id)}><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
            {categories.length === 0 && <p className="text-muted-foreground col-span-full text-center py-8">No categories yet.</p>}
          </div>
        </TabsContent>

        <TabsContent value="tags" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Tags</h2>
            <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
              <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Add Tag</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Tag</DialogTitle></DialogHeader>
                <div className="space-y-4 mt-4">
                  <div><Label>Name *</Label><Input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="Tag name" /></div>
                  <Button onClick={addTag} className="w-full">Add Tag</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <Badge key={tag.id} variant="secondary" className="text-sm py-1.5 px-3 flex items-center gap-2">
                <Tag className="w-3 h-3" />{tag.name}
                <button onClick={() => deleteTag(tag.id)} className="hover:text-destructive"><X className="w-3 h-3" /></button>
              </Badge>
            ))}
            {tags.length === 0 && <p className="text-muted-foreground">No tags yet.</p>}
          </div>
        </TabsContent>
      </Tabs>

      <ImageCropper open={cropperOpen} onClose={() => { setCropperOpen(false); setImageSrc(""); }} imageSrc={imageSrc} onCropComplete={handleCroppedImage} aspectRatio={16 / 9} />
    </div>
  );
};

export default AdminBlog;