import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Download, Printer, Plus, Trash2, Search } from "lucide-react";
import { format } from "date-fns";

interface Appointment {
  id: string;
  reference_id: string | null;
  appointment_date: string;
  appointment_time: string;
  status: string | null;
  notes: string | null;
  user: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
  };
  service: {
    name: string;
    price: number | null;
  } | null;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  items: InvoiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  notes: string;
  terms: string;
}

const AdminInvoices = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState<string>("");
  const [showInvoice, setShowInvoice] = useState(false);
  const [companyInfo, setCompanyInfo] = useState({
    name: "Krishna Tech Solutions",
    address: "Main Road, Karnataka",
    email: "krishnatechsolutions2024@gmail.com",
    phone: "+91 7026292525",
    gst: "",
  });
  const [invoice, setInvoice] = useState<InvoiceData>({
    invoiceNumber: "",
    invoiceDate: format(new Date(), "yyyy-MM-dd"),
    dueDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    customerAddress: "",
    items: [],
    subtotal: 0,
    taxRate: 18,
    taxAmount: 0,
    discount: 0,
    total: 0,
    notes: "",
    terms: "Payment is due within 7 days of invoice date.",
  });
  const invoiceRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAppointments();
    fetchCompanyInfo();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("appointments")
      .select("id, reference_id, appointment_date, appointment_time, status, notes, user_id, service_id")
      .in("status", ["confirmed", "completed"])
      .order("appointment_date", { ascending: false });

    if (error) {
      toast({ title: "Error", description: "Failed to fetch appointments", variant: "destructive" });
      setLoading(false);
      return;
    }

    // Fetch user and service details
    const appointmentsWithDetails: Appointment[] = [];
    for (const apt of data || []) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email, phone, address")
        .eq("user_id", apt.user_id)
        .maybeSingle();

      const { data: service } = apt.service_id
        ? await supabase.from("services").select("name, price").eq("id", apt.service_id).maybeSingle()
        : { data: null };

      appointmentsWithDetails.push({
        ...apt,
        user: profile || { full_name: null, email: null, phone: null, address: null },
        service: service,
      });
    }

    setAppointments(appointmentsWithDetails);
    setLoading(false);
  };

  const fetchCompanyInfo = async () => {
    const { data } = await supabase
      .from("site_settings")
      .select("key, value")
      .in("key", ["site_name", "contact_email", "contact_phone", "contact_address", "gst_number"]);

    if (data) {
      const settings: Record<string, string> = {};
      data.forEach((s) => (settings[s.key] = s.value));
      setCompanyInfo({
        name: settings.site_name || "Krishna Tech Solutions",
        address: settings.contact_address || "Main Road, Karnataka",
        email: settings.contact_email || "krishnatechsolutions2024@gmail.com",
        phone: settings.contact_phone || "+91 7026292525",
        gst: settings.gst_number || "",
      });
    }
  };

  const generateInvoiceNumber = () => {
    const prefix = "INV";
    const date = format(new Date(), "yyMMdd");
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${date}-${random}`;
  };

  const handleSelectAppointment = (appointmentId: string) => {
    setSelectedAppointment(appointmentId);
    const apt = appointments.find((a) => a.id === appointmentId);
    if (apt) {
      const items: InvoiceItem[] = apt.service
        ? [
            {
              description: apt.service.name,
              quantity: 1,
              rate: apt.service.price || 0,
              amount: apt.service.price || 0,
            },
          ]
        : [];

      const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
      const taxAmount = (subtotal * invoice.taxRate) / 100;
      const total = subtotal + taxAmount - invoice.discount;

      setInvoice({
        ...invoice,
        invoiceNumber: generateInvoiceNumber(),
        customerName: apt.user.full_name || "",
        customerEmail: apt.user.email || "",
        customerPhone: apt.user.phone || "",
        customerAddress: apt.user.address || "",
        items,
        subtotal,
        taxAmount,
        total,
        notes: `Appointment Reference: ${apt.reference_id || apt.id}\nDate: ${format(new Date(apt.appointment_date), "PPP")}\nTime: ${apt.appointment_time}`,
      });
    }
  };

  const addItem = () => {
    setInvoice({
      ...invoice,
      items: [...invoice.items, { description: "", quantity: 1, rate: 0, amount: 0 }],
    });
  };

  const removeItem = (index: number) => {
    const newItems = invoice.items.filter((_, i) => i !== index);
    updateTotals(newItems);
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...invoice.items];
    newItems[index] = { ...newItems[index], [field]: value };
    if (field === "quantity" || field === "rate") {
      newItems[index].amount = newItems[index].quantity * newItems[index].rate;
    }
    updateTotals(newItems);
  };

  const updateTotals = (items: InvoiceItem[]) => {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = (subtotal * invoice.taxRate) / 100;
    const total = subtotal + taxAmount - invoice.discount;
    setInvoice({ ...invoice, items, subtotal, taxAmount, total });
  };

  const handlePrint = () => {
    const printContent = invoiceRef.current;
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoice.invoiceNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
            .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .company-info h1 { margin: 0; color: #2563eb; }
            .invoice-info { text-align: right; }
            .invoice-info h2 { margin: 0 0 10px; color: #333; }
            .customer-info { margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            th { background: #f3f4f6; padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb; }
            td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
            .totals { text-align: right; }
            .totals .row { margin: 8px 0; }
            .totals .total { font-size: 1.2em; font-weight: bold; color: #2563eb; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 0.9em; color: #666; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const filteredAppointments = appointments.filter(
    (apt) =>
      apt.reference_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Invoice Generator</h2>
          <p className="text-muted-foreground">Create invoices for completed appointments</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointment Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Select Appointment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by reference, name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedAppointment} onValueChange={handleSelectAppointment}>
              <SelectTrigger>
                <SelectValue placeholder="Select an appointment" />
              </SelectTrigger>
              <SelectContent>
                {filteredAppointments.map((apt) => (
                  <SelectItem key={apt.id} value={apt.id}>
                    {apt.reference_id || apt.id.slice(0, 8)} - {apt.user.full_name || "Unknown"} - {apt.service?.name || "No Service"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedAppointment && (
              <div className="space-y-4 pt-4 border-t">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Invoice Number</Label>
                    <Input value={invoice.invoiceNumber} onChange={(e) => setInvoice({ ...invoice, invoiceNumber: e.target.value })} />
                  </div>
                  <div>
                    <Label>Invoice Date</Label>
                    <Input type="date" value={invoice.invoiceDate} onChange={(e) => setInvoice({ ...invoice, invoiceDate: e.target.value })} />
                  </div>
                  <div>
                    <Label>Due Date</Label>
                    <Input type="date" value={invoice.dueDate} onChange={(e) => setInvoice({ ...invoice, dueDate: e.target.value })} />
                  </div>
                  <div>
                    <Label>Tax Rate (%)</Label>
                    <Input
                      type="number"
                      value={invoice.taxRate}
                      onChange={(e) => {
                        const taxRate = parseFloat(e.target.value) || 0;
                        const taxAmount = (invoice.subtotal * taxRate) / 100;
                        const total = invoice.subtotal + taxAmount - invoice.discount;
                        setInvoice({ ...invoice, taxRate, taxAmount, total });
                      }}
                    />
                  </div>
                </div>

                <div>
                  <Label>Customer Name</Label>
                  <Input value={invoice.customerName} onChange={(e) => setInvoice({ ...invoice, customerName: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Email</Label>
                    <Input value={invoice.customerEmail} onChange={(e) => setInvoice({ ...invoice, customerEmail: e.target.value })} />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input value={invoice.customerPhone} onChange={(e) => setInvoice({ ...invoice, customerPhone: e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Address</Label>
                  <Textarea value={invoice.customerAddress} onChange={(e) => setInvoice({ ...invoice, customerAddress: e.target.value })} rows={2} />
                </div>

                {/* Items */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Line Items</Label>
                    <Button variant="outline" size="sm" onClick={addItem}>
                      <Plus className="w-4 h-4 mr-1" />
                      Add Item
                    </Button>
                  </div>
                  {invoice.items.map((item, index) => (
                    <div key={index} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Input
                          placeholder="Description"
                          value={item.description}
                          onChange={(e) => updateItem(index, "description", e.target.value)}
                        />
                      </div>
                      <div className="w-20">
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <div className="w-24">
                        <Input
                          type="number"
                          placeholder="Rate"
                          value={item.rate}
                          onChange={(e) => updateItem(index, "rate", parseFloat(e.target.value) || 0)}
                        />
                      </div>
                      <div className="w-24">
                        <Input value={`₹${item.amount}`} disabled />
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeItem(index)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Discount (₹)</Label>
                    <Input
                      type="number"
                      value={invoice.discount}
                      onChange={(e) => {
                        const discount = parseFloat(e.target.value) || 0;
                        const total = invoice.subtotal + invoice.taxAmount - discount;
                        setInvoice({ ...invoice, discount, total });
                      }}
                    />
                  </div>
                </div>

                <div>
                  <Label>Notes</Label>
                  <Textarea value={invoice.notes} onChange={(e) => setInvoice({ ...invoice, notes: e.target.value })} rows={3} />
                </div>

                <Button onClick={() => setShowInvoice(true)} className="w-full">
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Invoice Preview
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice Preview */}
        {showInvoice && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Invoice Preview</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handlePrint}>
                    <Printer className="w-4 h-4 mr-1" />
                    Print
                  </Button>
                  <Button size="sm" onClick={handlePrint}>
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div ref={invoiceRef} className="bg-white text-gray-900 p-6 rounded-lg">
                {/* Header */}
                <div className="flex justify-between mb-8">
                  <div className="company-info">
                    <h1 className="text-2xl font-bold text-primary">{companyInfo.name}</h1>
                    <p className="text-sm text-gray-600">{companyInfo.address}</p>
                    <p className="text-sm text-gray-600">{companyInfo.email}</p>
                    <p className="text-sm text-gray-600">{companyInfo.phone}</p>
                    {companyInfo.gst && <p className="text-sm text-gray-600">GST: {companyInfo.gst}</p>}
                  </div>
                  <div className="invoice-info text-right">
                    <h2 className="text-xl font-semibold">INVOICE</h2>
                    <p className="text-sm">#{invoice.invoiceNumber}</p>
                    <p className="text-sm mt-2">Date: {format(new Date(invoice.invoiceDate), "PPP")}</p>
                    <p className="text-sm">Due: {format(new Date(invoice.dueDate), "PPP")}</p>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="customer-info mb-6">
                  <h3 className="font-semibold text-gray-700 mb-2">Bill To:</h3>
                  <p className="font-medium">{invoice.customerName}</p>
                  <p className="text-sm text-gray-600">{invoice.customerEmail}</p>
                  <p className="text-sm text-gray-600">{invoice.customerPhone}</p>
                  <p className="text-sm text-gray-600">{invoice.customerAddress}</p>
                </div>

                {/* Items Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoice.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.description}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">₹{item.rate.toLocaleString()}</TableCell>
                        <TableCell className="text-right">₹{item.amount.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Totals */}
                <div className="totals mt-6 text-right">
                  <div className="row">Subtotal: ₹{invoice.subtotal.toLocaleString()}</div>
                  <div className="row">Tax ({invoice.taxRate}%): ₹{invoice.taxAmount.toLocaleString()}</div>
                  {invoice.discount > 0 && <div className="row">Discount: -₹{invoice.discount.toLocaleString()}</div>}
                  <div className="row total text-xl font-bold text-primary mt-2">
                    Total: ₹{invoice.total.toLocaleString()}
                  </div>
                </div>

                {/* Notes & Terms */}
                {invoice.notes && (
                  <div className="footer mt-6">
                    <h4 className="font-semibold text-sm">Notes:</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-line">{invoice.notes}</p>
                  </div>
                )}
                <div className="footer mt-4">
                  <h4 className="font-semibold text-sm">Terms & Conditions:</h4>
                  <p className="text-sm text-gray-600">{invoice.terms}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AdminInvoices;
