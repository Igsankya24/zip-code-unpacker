import { useActiveVisitors } from "@/hooks/useActiveVisitors";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Globe, Activity } from "lucide-react";

const ActiveVisitorsCard = () => {
  const { activeCount, visitors } = useActiveVisitors();

  // Group visitors by page
  const pageGroups: Record<string, number> = {};
  visitors.forEach((v) => {
    pageGroups[v.page] = (pageGroups[v.page] || 0) + 1;
  });

  const topPages = Object.entries(pageGroups)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-500" />
              Live Visitors
            </CardTitle>
            <CardDescription>Currently active on your website</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-3xl font-bold text-green-600 dark:text-green-400">{activeCount}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {topPages.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground mb-2">Active pages:</p>
            {topPages.map(([page, count]) => (
              <div key={page} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Globe className="h-3 w-3 text-muted-foreground" />
                  <span className="truncate max-w-[150px]">{page}</span>
                </div>
                <Badge variant="secondary" className="ml-2">
                  <Users className="h-3 w-3 mr-1" />
                  {count}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-2">
            No active visitors at the moment
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ActiveVisitorsCard;
