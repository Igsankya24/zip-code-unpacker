import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Calendar, User, ArrowRight, Tag, Folder, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  author_name: string;
  published_at: string | null;
  views_count: number;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface BlogTag {
  id: string;
  name: string;
  slug: string;
}

interface BlogAd {
  id: string;
  title: string;
  ad_code: string;
  placement: string;
  ad_type: string;
}

const Blog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [sidebarAds, setSidebarAds] = useState<BlogAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const { settings: s } = useSiteSettings();
  const adContainerRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const selectedCategory = searchParams.get("category");
  const selectedTag = searchParams.get("tag");

  useEffect(() => {
    fetchCategories();
    fetchTags();
    fetchAds();
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [selectedCategory, selectedTag]);

  // Execute ad scripts when ads are loaded
  useEffect(() => {
    sidebarAds.forEach((ad) => {
      const container = adContainerRefs.current[ad.id];
      if (container) {
        // Clear and re-insert to execute scripts
        container.innerHTML = ad.ad_code;
        
        // Execute any script tags
        const scripts = container.querySelectorAll("script");
        scripts.forEach((script) => {
          const newScript = document.createElement("script");
          Array.from(script.attributes).forEach((attr) => {
            newScript.setAttribute(attr.name, attr.value);
          });
          newScript.textContent = script.textContent;
          script.parentNode?.replaceChild(newScript, script);
        });
      }
    });
  }, [sidebarAds]);

  const fetchPosts = async () => {
    let query = supabase
      .from("blog_posts")
      .select("id, title, slug, excerpt, featured_image, author_name, published_at, views_count, category_id")
      .eq("is_published", true)
      .order("published_at", { ascending: false });

    if (selectedCategory) {
      query = query.eq("category_id", selectedCategory);
    }

    const { data } = await query;

    if (data) {
      // If tag filter is selected, filter posts by tag
      if (selectedTag) {
        const { data: taggedPosts } = await supabase
          .from("blog_post_tags")
          .select("post_id")
          .eq("tag_id", selectedTag);

        const taggedPostIds = taggedPosts?.map((tp) => tp.post_id) || [];
        setPosts(data.filter((p) => taggedPostIds.includes(p.id)));
      } else {
        setPosts(data);
      }
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

  const fetchAds = async () => {
    const { data } = await supabase
      .from("blog_ads")
      .select("*")
      .eq("is_active", true)
      .eq("placement", "sidebar")
      .order("display_order", { ascending: true });
    if (data) setSidebarAds(data);
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return null;
    return categories.find((c) => c.id === categoryId)?.name;
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const setFilter = (type: "category" | "tag", value: string) => {
    const newParams = new URLSearchParams();
    newParams.set(type, value);
    setSearchParams(newParams);
  };

  return (
    <Layout>
      {/* Hero Section */}
      <section className="pt-32 pb-16 hero-section">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-block px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-medium mb-6">
              {s.blog_badge || "Our Blog"}
            </span>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-hero-foreground mb-4">
              {s.blog_title || "Latest News & Articles"}
            </h1>
            <p className="text-hero-foreground/70 text-lg">
              {s.blog_description || "Stay updated with the latest tech tips, tutorials, and company news."}
            </p>
          </div>
        </div>
      </section>

      {/* Blog Content */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          {/* Active Filters */}
          {(selectedCategory || selectedTag) && (
            <div className="mb-8 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Filtering by:</span>
              {selectedCategory && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Folder className="w-3 h-3" />
                  {categories.find((c) => c.id === selectedCategory)?.name}
                  <button onClick={clearFilters}><X className="w-3 h-3" /></button>
                </Badge>
              )}
              {selectedTag && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {tags.find((t) => t.id === selectedTag)?.name}
                  <button onClick={clearFilters}><X className="w-3 h-3" /></button>
                </Badge>
              )}
              <Button variant="ghost" size="sm" onClick={clearFilters}>Clear all</Button>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading posts...</div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">No blog posts found.</p>
                  {(selectedCategory || selectedTag) && (
                    <Button variant="outline" onClick={clearFilters}>Clear filters</Button>
                  )}
                </div>
              ) : (
                <div className="space-y-8">
                  {posts.map((post) => (
                    <article
                      key={post.id}
                      className="bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/50 transition-colors"
                    >
                      {post.featured_image && (
                        <Link to={`/blog/${post.slug}`}>
                          <img
                            src={post.featured_image}
                            alt={post.title}
                            className="w-full h-56 object-cover hover:opacity-90 transition-opacity"
                          />
                        </Link>
                      )}
                      <div className="p-6">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3 flex-wrap">
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {post.author_name}
                          </span>
                          {post.published_at && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(post.published_at).toLocaleDateString()}
                            </span>
                          )}
                          {getCategoryName(post.category_id) && (
                            <Badge
                              variant="outline"
                              className="cursor-pointer"
                              onClick={() => setFilter("category", post.category_id!)}
                            >
                              <Folder className="w-3 h-3 mr-1" />
                              {getCategoryName(post.category_id)}
                            </Badge>
                          )}
                        </div>
                        <Link to={`/blog/${post.slug}`}>
                          <h2 className="font-display text-xl font-bold text-foreground mb-2 hover:text-primary transition-colors">
                            {post.title}
                          </h2>
                        </Link>
                        <p className="text-muted-foreground mb-4 line-clamp-2">
                          {post.excerpt || "Read more about this topic..."}
                        </p>
                        <Link to={`/blog/${post.slug}`}>
                          <Button variant="ghost" className="p-0 h-auto text-primary hover:text-primary/80">
                            Read More <ArrowRight className="w-4 h-4 ml-1" />
                          </Button>
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Categories */}
              {categories.length > 0 && (
                <div className="bg-card rounded-xl border border-border p-6">
                  <h3 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <Folder className="w-5 h-5 text-primary" />
                    Categories
                  </h3>
                  <div className="space-y-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setFilter("category", cat.id)}
                        className={`block w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          selectedCategory === cat.id
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-muted text-foreground"
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {tags.length > 0 && (
                <div className="bg-card rounded-xl border border-border p-6">
                  <h3 className="font-display text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <Tag className="w-5 h-5 text-primary" />
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant={selectedTag === tag.id ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => setFilter("tag", tag.id)}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Sidebar Ads */}
              {sidebarAds.map((ad) => (
                <div
                  key={ad.id}
                  ref={(el) => { adContainerRefs.current[ad.id] = el; }}
                  className="bg-card rounded-xl border border-border p-4 overflow-hidden"
                />
              ))}

              {/* Contact CTA */}
              <div className="bg-card rounded-xl border border-border p-6">
                <h3 className="font-display text-lg font-bold text-foreground mb-2">
                  Need Tech Support?
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Contact us for professional data recovery and computer repair services.
                </p>
                <Link to="/contact">
                  <Button className="w-full">Contact Us</Button>
                </Link>
              </div>

              {/* Recent Posts */}
              {posts.length > 0 && !selectedCategory && !selectedTag && (
                <div className="bg-card rounded-xl border border-border p-6">
                  <h3 className="font-display text-lg font-bold text-foreground mb-4">
                    Recent Posts
                  </h3>
                  <div className="space-y-4">
                    {posts.slice(0, 5).map((post) => (
                      <Link key={post.id} to={`/blog/${post.slug}`} className="block group">
                        <h4 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2">
                          {post.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {post.published_at && new Date(post.published_at).toLocaleDateString()}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Blog;