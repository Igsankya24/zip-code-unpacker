import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, Globe, Monitor, Smartphone, Tablet, ExternalLink, TrendingUp, Users, MapPin } from "lucide-react";
import { subDays, format, parseISO } from "date-fns";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from "recharts";

interface PageData {
  path: string;
  views: number;
  uniqueVisitors: number;
}

interface ReferrerData {
  source: string;
  visits: number;
  percentage: number;
}

interface DeviceData {
  type: string;
  count: number;
  icon: React.ReactNode;
}

interface DailyData {
  date: string;
  views: number;
  visitors: number;
}

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const TrafficAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [pageData, setPageData] = useState<PageData[]>([]);
  const [referrerData, setReferrerData] = useState<ReferrerData[]>([]);
  const [deviceData, setDeviceData] = useState<DeviceData[]>([]);
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [stats, setStats] = useState({
    totalViews: 0,
    uniqueVisitors: 0,
    avgViewsPerVisitor: 0,
    bounceRate: 0,
  });

  useEffect(() => {
    fetchTrafficData();
  }, []);

  const detectDevice = (userAgent: string): string => {
    if (!userAgent) return "Unknown";
    const ua = userAgent.toLowerCase();
    if (/mobile|android|iphone|ipad|ipod|blackberry|windows phone/i.test(ua)) {
      if (/ipad|tablet/i.test(ua)) return "Tablet";
      return "Mobile";
    }
    return "Desktop";
  };

  const extractReferrerDomain = (referrer: string | null): string => {
    if (!referrer || referrer === "") return "Direct";
    try {
      const url = new URL(referrer);
      return url.hostname.replace("www.", "");
    } catch {
      return "Direct";
    }
  };

  const fetchTrafficData = async () => {
    setLoading(true);
    try {
      const weekAgo = subDays(new Date(), 7);

      // Get all page views from last 7 days
      const { data: views } = await supabase
        .from("page_views")
        .select("*")
        .gte("created_at", weekAgo.toISOString())
        .order("created_at", { ascending: false });

      if (!views || views.length === 0) {
        setLoading(false);
        return;
      }

      // Calculate page breakdown
      const pageMap: Record<string, { views: number; visitors: Set<string> }> = {};
      views.forEach((v) => {
        if (!pageMap[v.page_path]) {
          pageMap[v.page_path] = { views: 0, visitors: new Set() };
        }
        pageMap[v.page_path].views++;
        if (v.visitor_id) {
          pageMap[v.page_path].visitors.add(v.visitor_id);
        }
      });

      const pages: PageData[] = Object.entries(pageMap)
        .map(([path, data]) => ({
          path,
          views: data.views,
          uniqueVisitors: data.visitors.size,
        }))
        .sort((a, b) => b.views - a.views);

      setPageData(pages);

      // Calculate referrer breakdown
      const referrerMap: Record<string, number> = {};
      views.forEach((v) => {
        const source = extractReferrerDomain(v.referrer);
        referrerMap[source] = (referrerMap[source] || 0) + 1;
      });

      const totalReferrers = views.length;
      const referrers: ReferrerData[] = Object.entries(referrerMap)
        .map(([source, visits]) => ({
          source,
          visits,
          percentage: Math.round((visits / totalReferrers) * 100),
        }))
        .sort((a, b) => b.visits - a.visits)
        .slice(0, 10);

      setReferrerData(referrers);

      // Calculate device breakdown
      const deviceMap: Record<string, number> = { Desktop: 0, Mobile: 0, Tablet: 0, Unknown: 0 };
      views.forEach((v) => {
        const device = detectDevice(v.user_agent || "");
        deviceMap[device]++;
      });

      const devices: DeviceData[] = [
        { type: "Desktop", count: deviceMap.Desktop, icon: <Monitor className="h-4 w-4" /> },
        { type: "Mobile", count: deviceMap.Mobile, icon: <Smartphone className="h-4 w-4" /> },
        { type: "Tablet", count: deviceMap.Tablet, icon: <Tablet className="h-4 w-4" /> },
      ].filter((d) => d.count > 0);

      setDeviceData(devices);

      // Calculate daily breakdown
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i);
        return format(date, "yyyy-MM-dd");
      });

      const dailyMap: Record<string, { views: number; visitors: Set<string> }> = {};
      last7Days.forEach((d) => (dailyMap[d] = { views: 0, visitors: new Set() }));

      views.forEach((v) => {
        if (v.created_at) {
          const date = format(parseISO(v.created_at), "yyyy-MM-dd");
          if (dailyMap[date]) {
            dailyMap[date].views++;
            if (v.visitor_id) {
              dailyMap[date].visitors.add(v.visitor_id);
            }
          }
        }
      });

      const daily: DailyData[] = last7Days.map((date) => ({
        date: format(parseISO(date), "EEE"),
        views: dailyMap[date].views,
        visitors: dailyMap[date].visitors.size,
      }));

      setDailyData(daily);

      // Calculate overall stats
      const allVisitors = new Set(views.map((v) => v.visitor_id).filter(Boolean));
      const totalViews = views.length;
      const uniqueVisitors = allVisitors.size;

      // Calculate bounce rate (visitors with only 1 page view)
      const visitorPageCounts: Record<string, number> = {};
      views.forEach((v) => {
        if (v.visitor_id) {
          visitorPageCounts[v.visitor_id] = (visitorPageCounts[v.visitor_id] || 0) + 1;
        }
      });
      const singlePageVisitors = Object.values(visitorPageCounts).filter((c) => c === 1).length;
      const bounceRate = uniqueVisitors > 0 ? Math.round((singlePageVisitors / uniqueVisitors) * 100) : 0;

      setStats({
        totalViews,
        uniqueVisitors,
        avgViewsPerVisitor: uniqueVisitors > 0 ? Math.round((totalViews / uniqueVisitors) * 10) / 10 : 0,
        bounceRate,
      });
    } catch (error) {
      console.error("Error fetching traffic data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Traffic Analytics</h2>
        <p className="text-muted-foreground">Detailed website traffic insights from the last 7 days</p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Eye className="h-4 w-4 text-blue-500" />
              Total Views
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViews}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-green-500" />
              Unique Visitors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniqueVisitors}</div>
            <p className="text-xs text-muted-foreground">Individual users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              Pages/Visitor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgViewsPerVisitor}</div>
            <p className="text-xs text-muted-foreground">Average views</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ExternalLink className="h-4 w-4 text-orange-500" />
              Bounce Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.bounceRate}%</div>
            <p className="text-xs text-muted-foreground">Single page visits</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Traffic Trend</CardTitle>
          <CardDescription>Views and unique visitors per day</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyData}>
                <defs>
                  <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="visitorsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                />
                <Area type="monotone" dataKey="views" stroke="#6366f1" fill="url(#viewsGradient)" strokeWidth={2} name="Views" />
                <Area type="monotone" dataKey="visitors" stroke="#22c55e" fill="url(#visitorsGradient)" strokeWidth={2} name="Visitors" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="pages" className="w-full">
        <TabsList>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="referrers">Traffic Sources</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
        </TabsList>

        <TabsContent value="pages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Page-by-Page Breakdown</CardTitle>
              <CardDescription>Most visited pages on your website</CardDescription>
            </CardHeader>
            <CardContent>
              {pageData.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No page view data available yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Page Path</TableHead>
                      <TableHead className="text-right">Views</TableHead>
                      <TableHead className="text-right">Unique Visitors</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pageData.map((page, idx) => (
                      <TableRow key={page.path}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {idx === 0 && <Badge variant="default" className="text-xs">Top</Badge>}
                            <Globe className="h-4 w-4 text-muted-foreground" />
                            {page.path}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{page.views}</TableCell>
                        <TableCell className="text-right">{page.uniqueVisitors}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referrers" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Traffic Sources</CardTitle>
                <CardDescription>Where your visitors come from</CardDescription>
              </CardHeader>
              <CardContent>
                {referrerData.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No referrer data available yet</p>
                ) : (
                  <div className="space-y-3">
                    {referrerData.map((ref, idx) => (
                      <div key={ref.source} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                          <span className="font-medium">{ref.source}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{ref.visits} visits</span>
                          <Badge variant="secondary">{ref.percentage}%</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Source Distribution</CardTitle>
                <CardDescription>Visual breakdown of traffic sources</CardDescription>
              </CardHeader>
              <CardContent>
                {referrerData.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No data available</p>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={referrerData.slice(0, 6)}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="visits"
                          nameKey="source"
                        >
                          {referrerData.slice(0, 6).map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <div className="grid lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Device Types</CardTitle>
                <CardDescription>Breakdown by device category</CardDescription>
              </CardHeader>
              <CardContent>
                {deviceData.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No device data available yet</p>
                ) : (
                  <div className="space-y-4">
                    {deviceData.map((device, idx) => {
                      const total = deviceData.reduce((sum, d) => sum + d.count, 0);
                      const percentage = Math.round((device.count / total) * 100);
                      return (
                        <div key={device.type} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {device.icon}
                              <span className="font-medium">{device.type}</span>
                            </div>
                            <span className="text-muted-foreground">{device.count} ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="h-2 rounded-full transition-all"
                              style={{
                                width: `${percentage}%`,
                                backgroundColor: COLORS[idx % COLORS.length],
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Device Distribution</CardTitle>
                <CardDescription>Visual breakdown by device</CardDescription>
              </CardHeader>
              <CardContent>
                {deviceData.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">No data available</p>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={deviceData} layout="vertical">
                        <XAxis type="number" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                        <YAxis type="category" dataKey="type" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} width={80} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                        />
                        <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TrafficAnalytics;
