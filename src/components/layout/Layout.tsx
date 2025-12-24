import { ReactNode, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import Chatbot from "@/components/Chatbot";
import BookingPopup from "@/components/BookingPopup";
import Maintenance from "@/pages/Maintenance";
import { useMaintenanceMode } from "@/hooks/useMaintenanceMode";
import { supabase } from "@/integrations/supabase/client";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { isMaintenanceMode, isLoading } = useMaintenanceMode();
  const location = useLocation();
  const [chatbotEnabled, setChatbotEnabled] = useState(true);

  useEffect(() => {
    const fetchChatbotSetting = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "chatbot_enabled")
        .maybeSingle();
      
      if (data) {
        setChatbotEnabled(data.value !== "false");
      }
    };
    fetchChatbotSetting();
  }, []);

  const bypassPaths = ["/auth", "/admin"];
  const shouldBypass = bypassPaths.some(path => location.pathname.startsWith(path));

  if (!isLoading && isMaintenanceMode && !shouldBypass) {
    return <Maintenance />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-20">{children}</main>
      <Footer />
      {chatbotEnabled && <Chatbot />}
      <BookingPopup />
    </div>
  );
};

export default Layout;
