import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, User, Eye, ArrowLeft, Share2, Tag, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
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

const BlogPostPage = () => {
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [category, setCategory] = useState<Category | null>(null);
  const [postTags, setPostTags] = useState<BlogTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [ads, setAds] = useState<{ header: BlogAd[]; inContent: BlogAd[]; footer: BlogAd[]; sidebar: BlogAd[] }>({
    header: [],
    inContent: [],
    footer: [],
    sidebar: [],
  });
  const adRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const { toast } = useToast();

  useEffect(() => {
    if (slug) {
      fetchPost();
      fetchAds();
    }
  }, [slug]);

  // Execute ad scripts
  useEffect(() => {
    Object.entries(ads).forEach(([, adList]) => {
      adList.forEach((ad) => {
        const container = adRefs.current[ad.id];
        if (container && !container.dataset.loaded) {
          container.innerHTML = ad.ad_code;
          container.dataset.loaded = "true";
          
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
    });
  }, [ads]);

  const fetchPost = async () => {
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("is_published", true)
      .maybeSingle();

    if (data) {
      setPost(data);
      
      // Increment view count
      await supabase
        .from("blog_posts")
        .update({ views_count: (data.views_count || 0) + 1 })
        .eq("id", data.id);

      // Fetch category
      if (data.category_id) {
        const { data: catData } = await supabase
          .from("blog_categories")
          .select("*")
          .eq("id", data.category_id)
          .single();
        if (catData) setCategory(catData);
      }

      // Fetch tags
      const { data: tagData } = await supabase
        .from("blog_post_tags")
        .select("tag_id, blog_tags(*)")
        .eq("post_id", data.id);
      
      if (tagData) {
        setPostTags(tagData.map((t: any) => t.blog_tags).filter(Boolean));
      }
    }
    setLoading(false);
  };

  const fetchAds = async () => {
    const { data } = await supabase
      .from("blog_ads")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (data) {
      setAds({
        header: data.filter((a) => a.placement === "header"),
        inContent: data.filter((a) => a.placement === "in-content"),
        footer: data.filter((a) => a.placement === "footer"),
        sidebar: data.filter((a) => a.placement === "sidebar"),
      });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: post?.title, url: window.location.href });
      } catch (err) {}
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied to clipboard" });
    }
  };

  // Render content with in-content ads
  const renderContentWithAds = () => {
    if (!post) return null;
    
    const content = post.content;
    const inContentAds = ads.inContent;
    
    if (inContentAds.length === 0) {
      return <div className="prose prose-lg max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: content }} />;
    }

    // Split content by paragraphs and insert ads
    const paragraphs = content.split(/<\/p>/gi);
    const midpoint = Math.floor(paragraphs.length / 2);

    return (
      <div className="prose prose-lg max-w-none dark:prose-invert">
        <div dangerouslySetInnerHTML={{ __html: paragraphs.slice(0, midpoint).join("</p>") + "</p>" }} />
        
        {/* In-content ads */}
        <div className="not-prose my-8 space-y-4">
          {inContentAds.map((ad) => (
            <div
              key={ad.id}
              ref={(el) => { adRefs.current[ad.id] = el; }}
              className="bg-muted/30 rounded-xl p-4 overflow-hidden"
            />
          ))}
        </div>

        <div dangerouslySetInnerHTML={{ __html: paragraphs.slice(midpoint).join("</p>") }} />
      </div>
    );
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Post Not Found</h1>
            <p className="text-muted-foreground mb-6">The blog post you are looking for does not exist.</p>
            <Link to="/blog">
              <Button><ArrowLeft className="w-4 h-4 mr-2" />Back to Blog</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero Section */}
      <section className="pt-32 pb-8 hero-section">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Link to="/blog" className="inline-flex items-center text-primary hover:underline mb-6">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Link>
            
            {/* Category & Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              {category && (
                <Link to={`/blog?category=${category.id}`}>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Folder className="w-3 h-3" />{category.name}
                  </Badge>
                </Link>
              )}
              {postTags.map((tag) => (
                <Link key={tag.id} to={`/blog?tag=${tag.id}`}>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />{tag.name}
                  </Badge>
                </Link>
              ))}
            </div>

            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-hero-foreground mb-4">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-hero-foreground/70">
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />{post.author_name}
              </span>
              {post.published_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(post.published_at).toLocaleDateString("en-US", {
                    year: "numeric", month: "long", day: "numeric",
                  })}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />{post.views_count} views
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="text-hero-foreground/70 hover:text-hero-foreground"
              >
                <Share2 className="w-4 h-4 mr-1" />Share
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-8 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <article className="lg:col-span-2">
              {/* Header Ads */}
              {ads.header.length > 0 && (
                <div className="mb-8 space-y-4">
                  {ads.header.map((ad) => (
                    <div
                      key={ad.id}
                      ref={(el) => { adRefs.current[ad.id] = el; }}
                      className="bg-muted/30 rounded-xl p-4 overflow-hidden"
                    />
                  ))}
                </div>
              )}

              {/* Featured Image */}
              {post.featured_image && (
                <img
                  src={post.featured_image}
                  alt={post.title}
                  className="w-full h-auto rounded-2xl mb-8"
                />
              )}

              {/* Post Content */}
              {renderContentWithAds()}

              {/* Footer Ads */}
              {ads.footer.length > 0 && (
                <div className="mt-8 space-y-4">
                  {ads.footer.map((ad) => (
                    <div
                      key={ad.id}
                      ref={(el) => { adRefs.current[ad.id] = el; }}
                      className="bg-muted/30 rounded-xl p-4 overflow-hidden"
                    />
                  ))}
                </div>
              )}

              {/* Back to Blog */}
              <div className="mt-12 pt-8 border-t border-border">
                <Link to="/blog">
                  <Button variant="outline"><ArrowLeft className="w-4 h-4 mr-2" />Back to All Posts</Button>
                </Link>
              </div>
            </article>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Sidebar Ads */}
              {ads.sidebar.map((ad) => (
                <div
                  key={ad.id}
                  ref={(el) => { adRefs.current[ad.id] = el; }}
                  className="bg-card rounded-xl border border-border p-4 overflow-hidden"
                />
              ))}

              {/* Contact CTA */}
              <div className="bg-card rounded-xl border border-border p-6 sticky top-24">
                <h3 className="font-display text-lg font-bold text-foreground mb-2">
                  Need Tech Help?
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Our experts are ready to help with data recovery and computer repairs.
                </p>
                <Link to="/contact">
                  <Button className="w-full">Get Support</Button>
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default BlogPostPage;