import { LucideIcon, Calendar, ChevronDown, ExternalLink, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ServiceProject {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  project_url: string | null;
}

interface ServiceCardProps {
  id?: string;
  icon: LucideIcon;
  title: string;
  description: string;
  features?: string[];
  price?: string;
}

const ServiceCard = ({ id, icon: Icon, title, description, features, price }: ServiceCardProps) => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ServiceProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProjects();
    }
  }, [id]);

  const fetchProjects = async () => {
    if (!id) return;
    setLoadingProjects(true);
    const { data } = await supabase
      .from("service_projects")
      .select("id, title, description, image_url, project_url")
      .eq("service_id", id)
      .eq("is_visible", true)
      .order("display_order", { ascending: true });
    
    if (data) {
      setProjects(data);
    }
    setLoadingProjects(false);
  };

  const handleBookNow = () => {
    // Store selected service info in sessionStorage for chatbot
    if (id) {
      sessionStorage.setItem("chatbot_preselect_service", JSON.stringify({ id, title }));
      // Dispatch custom event to open chatbot
      window.dispatchEvent(new CustomEvent("openChatbotBooking", { detail: { serviceId: id, serviceName: title } }));
    }
  };

  return (
    <div className="group bg-card rounded-2xl p-8 border border-border/50 hover:border-primary/20 transition-all duration-300 hover:shadow-lg">
      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
        <Icon className="w-7 h-7 text-primary" />
      </div>

      <h3 className="font-bold text-xl text-card-foreground mb-3">
        {title}
      </h3>
      <p className="text-muted-foreground leading-relaxed">
        {description}
      </p>

      {features && features.length > 0 && (
        <ul className="space-y-2 mt-4">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              {feature}
            </li>
          ))}
        </ul>
      )}

      {price && (
        <div className="pt-4 mt-4 border-t border-border">
          <span className="text-sm text-muted-foreground">Starting from</span>
          <p className="font-bold text-2xl text-primary">{price}</p>
        </div>
      )}

      <div className="flex flex-col gap-2 mt-4">
        {projects.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" className="w-full">
                <FolderOpen className="w-4 h-4 mr-2" />
                Our Work ({projects.length})
                <ChevronDown className="w-4 h-4 ml-auto" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 bg-popover border border-border shadow-lg z-50">
              {projects.map((project) => (
                <DropdownMenuItem
                  key={project.id}
                  className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                  onClick={() => {
                    if (project.project_url) {
                      window.open(project.project_url, "_blank");
                    }
                  }}
                >
                  <div className="flex items-center gap-2 w-full">
                    <span className="font-medium text-foreground">{project.title}</span>
                    {project.project_url && (
                      <ExternalLink className="w-3 h-3 text-muted-foreground ml-auto" />
                    )}
                  </div>
                  {project.description && (
                    <span className="text-xs text-muted-foreground line-clamp-2">
                      {project.description}
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {id && (
          <Button 
            onClick={handleBookNow}
            className="w-full"
            variant="outline"
          >
            <Calendar className="w-4 h-4 mr-2" />
            Book Now
          </Button>
        )}
      </div>
    </div>
  );
};

export default ServiceCard;
