import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface SiteMetadata {
  siteTitle: string;
  faviconUrl: string;
}

export const useSiteMetadata = () => {
  const [metadata, setMetadata] = useState<SiteMetadata>({
    siteTitle: "Krishna Tech Solutions",
    faviconUrl: "/favicon.ico",
  });

  useEffect(() => {
    const fetchMetadata = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["site_title", "favicon_url"]);

      if (data) {
        const newMetadata: SiteMetadata = { ...metadata };
        data.forEach((setting) => {
          if (setting.key === "site_title" && setting.value) {
            newMetadata.siteTitle = setting.value;
          }
          if (setting.key === "favicon_url" && setting.value) {
            newMetadata.faviconUrl = setting.value;
          }
        });
        setMetadata(newMetadata);
      }
    };

    fetchMetadata();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("site_settings_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "site_settings",
        },
        (payload) => {
          if (payload.new && typeof payload.new === "object" && "key" in payload.new) {
            const { key, value } = payload.new as { key: string; value: string };
            if (key === "site_title" && value) {
              setMetadata((prev) => ({ ...prev, siteTitle: value }));
            }
            if (key === "favicon_url" && value) {
              setMetadata((prev) => ({ ...prev, faviconUrl: value }));
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Apply metadata to document
  useEffect(() => {
    // Update document title
    document.title = metadata.siteTitle;

    // Update favicon
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = metadata.faviconUrl;

    // Update OG title
    const ogTitle = document.querySelector("meta[property='og:title']");
    if (ogTitle) {
      ogTitle.setAttribute("content", metadata.siteTitle);
    }
  }, [metadata]);

  return metadata;
};
