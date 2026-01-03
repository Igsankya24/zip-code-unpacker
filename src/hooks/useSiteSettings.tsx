import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SiteSettings {
  [key: string]: string;
}

export const useSiteSettings = () => {
  const [settings, setSettings] = useState<SiteSettings>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from("site_settings").select("key, value");
      if (data) {
        const settingsObj: SiteSettings = {};
        data.forEach((item) => {
          settingsObj[item.key] = item.value;
        });
        setSettings(settingsObj);
      }
      setLoading(false);
    };

    fetchSettings();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("site_settings_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "site_settings",
        },
        (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            const { key, value } = payload.new as { key: string; value: string };
            setSettings((prev) => ({ ...prev, [key]: value }));
          } else if (payload.eventType === "DELETE") {
            const { key } = payload.old as { key: string };
            setSettings((prev) => {
              const newSettings = { ...prev };
              delete newSettings[key];
              return newSettings;
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { settings, loading };
};
