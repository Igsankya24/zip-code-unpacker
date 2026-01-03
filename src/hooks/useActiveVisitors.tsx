import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";

interface VisitorPresence {
  visitorId: string;
  page: string;
  onlineAt: string;
}

export const useActiveVisitors = () => {
  const [activeCount, setActiveCount] = useState(0);
  const [visitors, setVisitors] = useState<VisitorPresence[]>([]);
  const location = useLocation();

  useEffect(() => {
    // Get or create visitor ID
    let visitorId = localStorage.getItem("visitor_id");
    if (!visitorId) {
      visitorId = `v_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem("visitor_id", visitorId);
    }

    const channel = supabase.channel("active_visitors", {
      config: {
        presence: {
          key: visitorId,
        },
      },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const allVisitors: VisitorPresence[] = [];
        
        Object.values(state).forEach((presences: any[]) => {
          presences.forEach((presence) => {
            allVisitors.push({
              visitorId: presence.visitorId,
              page: presence.page,
              onlineAt: presence.onlineAt,
            });
          });
        });

        // Count unique visitors
        const uniqueVisitors = new Set(allVisitors.map((v) => v.visitorId));
        setActiveCount(uniqueVisitors.size);
        setVisitors(allVisitors);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            visitorId,
            page: location.pathname,
            onlineAt: new Date().toISOString(),
          });
        }
      });

    // Update presence when page changes
    const updatePresence = async () => {
      await channel.track({
        visitorId,
        page: location.pathname,
        onlineAt: new Date().toISOString(),
      });
    };

    updatePresence();

    return () => {
      channel.unsubscribe();
    };
  }, [location.pathname]);

  return { activeCount, visitors };
};
