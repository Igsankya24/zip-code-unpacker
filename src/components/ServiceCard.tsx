import { LucideIcon, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

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

      {id && (
        <Button 
          onClick={handleBookNow}
          className="w-full mt-4"
          variant="outline"
        >
          <Calendar className="w-4 h-4 mr-2" />
          Book Now
        </Button>
      )}
    </div>
  );
};

export default ServiceCard;
