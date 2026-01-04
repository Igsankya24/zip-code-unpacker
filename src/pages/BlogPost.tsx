import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, User, Eye, ArrowLeft, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
}

interface BlogAd {
  id: string;
  title: string;
  ad_code: string;
  placement: string;
}

const BlogPostPage = () => {
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [ads, setAds] = useState<{ header: BlogAd[]; inContent: BlogAd[]; footer: BlogAd[]; sidebar: BlogAd[] }>({
    header: [],
    inContent: [],
    footer: [],
    sidebar: [],
  });
  const { toast } = useToast();

  useEffect(() => {
    if (slug) {
      fetchPost();
      fetchAds();
    }
  }, [slug]);

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
        await navigator.share({
          title: post?.title,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied to clipboard" });
    }
  };

  // Split content for in-content ads
  const renderContentWithAds = (content: string) => {
    const paragraphs = content.split("\n\n");
    const midpoint = Math.floor(paragraphs.length / 2);

    return (
      <>
        {paragraphs.slice(0, midpoint).map((p, i) => (
          <p key={i} className="mb-4" dangerouslySetInnerHTML={{ __html: p }} />
        ))}
        
        {/* In-content ads */}
        {ads.inContent.length > 0 && (
          <div className="my-8">
            {ads.inContent.map((ad) => (
              <div
                key={ad.id}
                className="bg-muted/50 rounded-xl p-4 my-4"
                dangerouslySetInnerHTML={{ __html: ad.ad_code }}
              />
            ))}
          </div>
        )}

        {paragraphs.slice(midpoint).map((p, i) => (
          <p key={i + midpoint} className="mb-4" dangerouslySetInnerHTML={{ __html: p }} />
        ))}
      </>
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
            <p className="text-muted-foreground mb-6">The blog post you're looking for doesn't exist.</p>
            <Link to="/blog">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Blog
              </Button>
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
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-hero-foreground mb-4">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-hero-foreground/70">
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                {post.author_name}
              </span>
              {post.published_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(post.published_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {post.views_count} views
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="text-hero-foreground/70 hover:text-hero-foreground"
              >
                <Share2 className="w-4 h-4 mr-1" />
                Share
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
                <div className="mb-8">
                  {ads.header.map((ad) => (
                    <div
                      key={ad.id}
                      className="bg-muted/50 rounded-xl p-4"
                      dangerouslySetInnerHTML={{ __html: ad.ad_code }}
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
              <div className="prose prose-lg max-w-none dark:prose-invert">
                {renderContentWithAds(post.content)}
              </div>

              {/* Footer Ads */}
              {ads.footer.length > 0 && (
                <div className="mt-8">
                  {ads.footer.map((ad) => (
                    <div
                      key={ad.id}
                      className="bg-muted/50 rounded-xl p-4"
                      dangerouslySetInnerHTML={{ __html: ad.ad_code }}
                    />
                  ))}
                </div>
              )}

              {/* Back to Blog */}
              <div className="mt-12 pt-8 border-t border-border">
                <Link to="/blog">
                  <Button variant="outline">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to All Posts
                  </Button>
                </Link>
              </div>
            </article>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Sidebar Ads */}
              {ads.sidebar.map((ad) => (
                <div
                  key={ad.id}
                  className="bg-card rounded-xl border border-border p-4 sticky top-24"
                  dangerouslySetInnerHTML={{ __html: ad.ad_code }}
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