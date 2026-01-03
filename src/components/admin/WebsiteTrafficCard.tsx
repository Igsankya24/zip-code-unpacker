import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, TrendingUp, Users, Globe } from "lucide-react";
import { subDays, format, parseISO } from "date-fns";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";

interface TrafficData {
  date: string;
  views: number;
}

const WebsiteTrafficCard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayViews: 0,
    weekViews: 0,
    uniqueVisitors: 0,
    topPage: "",
  });
  const [chartData, setChartData] = useState<TrafficData[]>([]);

  useEffect(() => {
    fetchTrafficData();
  }, []);

  const fetchTrafficData = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = subDays(now, 7);

      // Get today's views
      const { count: todayCount } = await supabase
        .from("page_views")
        .select("*", { count: "exact", head: true })
        .gte("created_at", todayStart.toISOString());

      // Get week's views
      const { count: weekCount } = await supabase
        .from("page_views")
        .select("*", { count: "exact", head: true })
        .gte("created_at", weekAgo.toISOString());

      // Get unique visitors this week
      const { data: visitors } = await supabase
        .from("page_views")
        .select("visitor_id")
        .gte("created_at", weekAgo.toISOString());

      const uniqueVisitors = new Set(visitors?.map(v => v.visitor_id)).size;

      // Get top page
      const { data: pageViews } = await supabase
        .from("page_views")
        .select("page_path")
        .gte("created_at", weekAgo.toISOString());

      const pageCounts: Record<string, number> = {};
      pageViews?.forEach(pv => {
        pageCounts[pv.page_path] = (pageCounts[pv.page_path] || 0) + 1;
      });

      const topPage = Object.entries(pageCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || "/";

      // Get chart data for last 7 days
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(now, 6 - i);
        return format(date, "yyyy-MM-dd");
      });

      const viewsByDate: Record<string, number> = {};
      last7Days.forEach(d => (viewsByDate[d] = 0));

      const { data: allViews } = await supabase
        .from("page_views")
        .select("created_at")
        .gte("created_at", weekAgo.toISOString());

      allViews?.forEach(view => {
        if (view.created_at) {
          const date = format(parseISO(view.created_at), "yyyy-MM-dd");
          if (viewsByDate[date] !== undefined) {
            viewsByDate[date]++;
          }
        }
      });

      setChartData(
        last7Days.map(date => ({
          date: format(parseISO(date), "EEE"),
          views: viewsByDate[date] || 0,
        }))
      );

      setStats({
        todayViews: todayCount || 0,
        weekViews: weekCount || 0,
        uniqueVisitors,
        topPage,
      });
    } catch (error) {
      console.error("Error fetching traffic data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Website Traffic</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-32 bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-full lg:col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Website Traffic
            </CardTitle>
            <CardDescription>Page views and visitor statistics</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.todayViews}</p>
              <p className="text-xs text-muted-foreground">Today</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.weekViews}</p>
              <p className="text-xs text-muted-foreground">This Week</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.uniqueVisitors}</p>
              <p className="text-xs text-muted-foreground">Unique Visitors</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Globe className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-lg font-bold truncate max-w-20" title={stats.topPage}>
                {stats.topPage}
              </p>
              <p className="text-xs text-muted-foreground">Top Page</p>
            </div>
          </div>
        </div>
        
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Area
                type="monotone"
                dataKey="views"
                stroke="hsl(var(--primary))"
                fill="url(#trafficGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export default WebsiteTrafficCard;
