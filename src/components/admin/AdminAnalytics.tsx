import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { Calendar, Users, TrendingUp, DollarSign, Clock, CheckCircle, Download, FileSpreadsheet, FileText, File, Image } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from "date-fns";
import { exportToExcel, exportToPDF, exportToWord } from "@/lib/exportUtils";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";

interface AppointmentData {
  date: string;
  count: number;
}

interface UserGrowthData {
  date: string;
  users: number;
  cumulative: number;
}

interface RevenueData {
  date: string;
  revenue: number;
}

interface StatusData {
  name: string;
  value: number;
  color: string;
}

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

const AdminAnalytics = () => {
  const [appointmentData, setAppointmentData] = useState<AppointmentData[]>([]);
  const [userGrowthData, setUserGrowthData] = useState<UserGrowthData[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [statusData, setStatusData] = useState<StatusData[]>([]);
  const [serviceData, setServiceData] = useState<{ name: string; bookings: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAppointments: 0,
    totalUsers: 0,
    totalRevenue: 0,
    completionRate: 0,
  });
  const { toast } = useToast();
  
  // Chart refs for export
  const appointmentChartRef = useRef<HTMLDivElement>(null);
  const statusChartRef = useRef<HTMLDivElement>(null);
  const userChartRef = useRef<HTMLDivElement>(null);
  const revenueChartRef = useRef<HTMLDivElement>(null);
  const serviceChartRef = useRef<HTMLDivElement>(null);

  const exportChartAsImage = async (ref: React.RefObject<HTMLDivElement>, filename: string) => {
    if (!ref.current) return;
    try {
      const canvas = await html2canvas(ref.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });
      const link = document.createElement('a');
      link.download = `${filename}_${format(new Date(), 'yyyy-MM-dd')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      toast({ title: "Success", description: `Chart exported as ${filename}.png` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to export chart", variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    await Promise.all([
      fetchAppointmentTrends(),
      fetchUserGrowth(),
      fetchRevenue(),
      fetchStatusDistribution(),
      fetchServicePopularity(),
      fetchOverallStats(),
    ]);
    setLoading(false);
  };

  const fetchAppointmentTrends = async () => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i);
      return format(date, "yyyy-MM-dd");
    });

    const { data } = await supabase
      .from("appointments")
      .select("appointment_date, created_at")
      .gte("created_at", subDays(new Date(), 30).toISOString());

    const countByDate: Record<string, number> = {};
    last30Days.forEach((d) => (countByDate[d] = 0));

    data?.forEach((apt) => {
      const date = format(parseISO(apt.created_at || ""), "yyyy-MM-dd");
      if (countByDate[date] !== undefined) {
        countByDate[date]++;
      }
    });

    setAppointmentData(
      last30Days.map((date) => ({
        date: format(parseISO(date), "MMM dd"),
        count: countByDate[date] || 0,
      }))
    );
  };

  const fetchUserGrowth = async () => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i);
      return format(date, "yyyy-MM-dd");
    });

    const { data } = await supabase
      .from("profiles")
      .select("created_at")
      .order("created_at", { ascending: true });

    const countByDate: Record<string, number> = {};
    last30Days.forEach((d) => (countByDate[d] = 0));

    data?.forEach((profile) => {
      if (profile.created_at) {
        const date = format(parseISO(profile.created_at), "yyyy-MM-dd");
        if (countByDate[date] !== undefined) {
          countByDate[date]++;
        }
      }
    });

    let cumulative = 0;
    const totalBefore = data?.filter((p) => {
      if (!p.created_at) return false;
      return parseISO(p.created_at) < subDays(new Date(), 30);
    }).length || 0;
    cumulative = totalBefore;

    setUserGrowthData(
      last30Days.map((date) => {
        cumulative += countByDate[date] || 0;
        return {
          date: format(parseISO(date), "MMM dd"),
          users: countByDate[date] || 0,
          cumulative,
        };
      })
    );
  };

  const fetchRevenue = async () => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i);
      return format(date, "yyyy-MM-dd");
    });

    const { data: appointments } = await supabase
      .from("appointments")
      .select("created_at, service_id, status")
      .gte("created_at", subDays(new Date(), 30).toISOString())
      .in("status", ["confirmed", "completed"]);

    const { data: services } = await supabase.from("services").select("id, price");

    const servicePrices: Record<string, number> = {};
    services?.forEach((s) => {
      servicePrices[s.id] = s.price || 0;
    });

    const revenueByDate: Record<string, number> = {};
    last30Days.forEach((d) => (revenueByDate[d] = 0));

    appointments?.forEach((apt) => {
      if (apt.created_at && apt.service_id) {
        const date = format(parseISO(apt.created_at), "yyyy-MM-dd");
        if (revenueByDate[date] !== undefined) {
          revenueByDate[date] += servicePrices[apt.service_id] || 0;
        }
      }
    });

    setRevenueData(
      last30Days.map((date) => ({
        date: format(parseISO(date), "MMM dd"),
        revenue: revenueByDate[date] || 0,
      }))
    );
  };

  const fetchStatusDistribution = async () => {
    const { data } = await supabase.from("appointments").select("status");

    const statusCount: Record<string, number> = {
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
    };

    data?.forEach((apt) => {
      const status = apt.status || "pending";
      statusCount[status] = (statusCount[status] || 0) + 1;
    });

    setStatusData([
      { name: "Pending", value: statusCount.pending, color: "#f59e0b" },
      { name: "Confirmed", value: statusCount.confirmed, color: "#6366f1" },
      { name: "Completed", value: statusCount.completed, color: "#22c55e" },
      { name: "Cancelled", value: statusCount.cancelled, color: "#ef4444" },
    ]);
  };

  const fetchServicePopularity = async () => {
    const { data: appointments } = await supabase
      .from("appointments")
      .select("service_id");

    const { data: services } = await supabase.from("services").select("id, name");

    const serviceNames: Record<string, string> = {};
    services?.forEach((s) => {
      serviceNames[s.id] = s.name;
    });

    const serviceCount: Record<string, number> = {};
    appointments?.forEach((apt) => {
      if (apt.service_id) {
        const name = serviceNames[apt.service_id] || "Unknown";
        serviceCount[name] = (serviceCount[name] || 0) + 1;
      }
    });

    setServiceData(
      Object.entries(serviceCount)
        .map(([name, bookings]) => ({ name, bookings }))
        .sort((a, b) => b.bookings - a.bookings)
        .slice(0, 5)
    );
  };

  const fetchOverallStats = async () => {
    const [appointmentsRes, usersRes, servicesRes] = await Promise.all([
      supabase.from("appointments").select("status, service_id"),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("services").select("id, price"),
    ]);

    const appointments = appointmentsRes.data || [];
    const completed = appointments.filter((a) => a.status === "completed").length;
    const total = appointments.length;

    const servicePrices: Record<string, number> = {};
    servicesRes.data?.forEach((s) => {
      servicePrices[s.id] = s.price || 0;
    });

    const totalRevenue = appointments
      .filter((a) => a.status === "completed" || a.status === "confirmed")
      .reduce((sum, apt) => sum + (servicePrices[apt.service_id || ""] || 0), 0);

    setStats({
      totalAppointments: total,
      totalUsers: usersRes.count || 0,
      totalRevenue,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    });
  };

  const handleExport = (type: 'excel' | 'pdf' | 'word', dataType: string) => {
    let exportData: any[] = [];
    let title = '';
    const filename = `analytics_${dataType}_${format(new Date(), 'yyyy-MM-dd')}`;

    switch (dataType) {
      case 'appointments':
        exportData = appointmentData.map(d => ({
          Date: d.date,
          'Appointments': d.count,
        }));
        title = 'Appointment Trends Report';
        break;
      case 'users':
        exportData = userGrowthData.map(d => ({
          Date: d.date,
          'New Users': d.users,
          'Total Users': d.cumulative,
        }));
        title = 'User Growth Report';
        break;
      case 'revenue':
        exportData = revenueData.map(d => ({
          Date: d.date,
          'Revenue (₹)': d.revenue,
        }));
        title = 'Revenue Trends Report';
        break;
      case 'services':
        exportData = serviceData.map(d => ({
          'Service Name': d.name,
          'Bookings': d.bookings,
        }));
        title = 'Service Popularity Report';
        break;
      case 'status':
        exportData = statusData.map(d => ({
          Status: d.name,
          Count: d.value,
        }));
        title = 'Status Distribution Report';
        break;
      case 'summary':
        exportData = [
          { Metric: 'Total Appointments', Value: stats.totalAppointments },
          { Metric: 'Total Users', Value: stats.totalUsers },
          { Metric: 'Total Revenue', Value: `₹${stats.totalRevenue.toLocaleString()}` },
          { Metric: 'Completion Rate', Value: `${stats.completionRate}%` },
        ];
        title = 'Analytics Summary Report';
        break;
    }

    switch (type) {
      case 'excel':
        exportToExcel(exportData, filename);
        break;
      case 'pdf':
        exportToPDF(exportData, filename, title);
        break;
      case 'word':
        exportToWord(exportData, filename, title);
        break;
    }

    toast({ title: "Success", description: `Exported ${title} to ${type.toUpperCase()}` });
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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Track your business performance</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => handleExport('excel', 'summary')}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Summary (Excel)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('pdf', 'summary')}>
              <FileText className="w-4 h-4 mr-2" />
              Summary (PDF)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('word', 'summary')}>
              <File className="w-4 h-4 mr-2" />
              Summary (Word)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('excel', 'appointments')}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Appointments (Excel)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('excel', 'users')}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              User Growth (Excel)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('excel', 'revenue')}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Revenue (Excel)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport('excel', 'services')}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Services (Excel)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAppointments}</div>
            <p className="text-xs text-muted-foreground">All time bookings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From confirmed bookings</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completionRate}%</div>
            <p className="text-xs text-muted-foreground">Appointments completed</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="appointments" className="w-full">
        <TabsList>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="users">User Growth</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
        </TabsList>

        <TabsContent value="appointments" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Appointment Trends (Last 30 Days)</CardTitle>
                  <CardDescription>Number of appointments booked per day</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => exportChartAsImage(appointmentChartRef, 'appointment_trends')}>
                  <Image className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div ref={appointmentChartRef}>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={appointmentData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary) / 0.2)"
                        name="Appointments"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Status Distribution</CardTitle>
                <CardDescription>Breakdown by status</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Growth (Last 30 Days)</CardTitle>
              <CardDescription>New signups and cumulative user count</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis yAxisId="left" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis yAxisId="right" orientation="right" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="users"
                    stroke="#22c55e"
                    name="New Users"
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="cumulative"
                    stroke="hsl(var(--primary))"
                    name="Total Users"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends (Last 30 Days)</CardTitle>
              <CardDescription>Daily revenue from confirmed and completed appointments</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services">
          <Card>
            <CardHeader>
              <CardTitle>Popular Services</CardTitle>
              <CardDescription>Most booked services</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={serviceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis type="category" dataKey="name" width={150} className="text-xs" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="bookings" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAnalytics;
