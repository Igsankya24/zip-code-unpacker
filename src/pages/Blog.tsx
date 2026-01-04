import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Calendar, User, Eye, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  featured_image: string | null;
  author_name: string;
  published_at: string | null;
  views_count: number;
}

interface BlogAd {
  id: string;
  title: string;
  ad_code: string;
  placement: string;
}

const Blog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [sidebarAds, setSidebarAds] = useState<BlogAd[]>([]);
  const [loading, setLoading] = useState(true);
  const { settings: s } = useSiteSettings();

  useEffect(() => {
    fetchPosts();
    fetchAds();
  }, []);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from("blog_posts")
      .select("id, title, slug, excerpt, featured_image, author_name, published_at, views_count")
      .eq("is_published", true)
      .order("published_at", { ascending: false });

    if (data) setPosts(data);
    setLoading(false);
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
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {loading ? (
                <div className="text-center py-12 text-muted-foreground">Loading posts...</div>
              ) : posts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">No blog posts yet.</p>
                  <p className="text-sm text-muted-foreground">Check back soon for new content!</p>
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
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
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
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {post.views_count} views
                          </span>
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
              {/* Sidebar Ads */}
              {sidebarAds.map((ad) => (
                <div
                  key={ad.id}
                  className="bg-card rounded-xl border border-border p-4"
                  dangerouslySetInnerHTML={{ __html: ad.ad_code }}
                />
              ))}

              {/* Newsletter / Contact Card */}
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
              {posts.length > 0 && (
                <div className="bg-card rounded-xl border border-border p-6">
                  <h3 className="font-display text-lg font-bold text-foreground mb-4">
                    Recent Posts
                  </h3>
                  <div className="space-y-4">
                    {posts.slice(0, 5).map((post) => (
                      <Link
                        key={post.id}
                        to={`/blog/${post.slug}`}
                        className="block group"
                      >
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