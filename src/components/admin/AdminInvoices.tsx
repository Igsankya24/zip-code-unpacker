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
import { FileText, Download, Printer, Plus, Trash2, Search, Save, History, Eye, Palette } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  discountPercent: number;
  couponCode: string | null;
  total: number;
  notes: string;
  terms: string;
}

interface SavedInvoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
}

type InvoiceTemplate = "modern" | "classic" | "minimal";

interface AdminInvoicesProps {
  preSelectedAppointmentId?: string | null;
  onClearSelection?: () => void;
  isSuperAdmin?: boolean;
}

const AdminInvoices = ({ preSelectedAppointmentId, onClearSelection, isSuperAdmin = false }: AdminInvoicesProps) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [savedInvoices, setSavedInvoices] = useState<SavedInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAppointment, setSelectedAppointment] = useState<string>("");
  const [showInvoice, setShowInvoice] = useState(false);
  const [activeTab, setActiveTab] = useState<"create" | "history">("create");
  const [selectedTemplate, setSelectedTemplate] = useState<InvoiceTemplate>("modern");
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
    discountPercent: 0,
    couponCode: null,
    total: 0,
    notes: "",
    terms: "Payment is due within 7 days of invoice date.",
  });
  const invoiceRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAppointments();
    fetchCompanyInfo();
    fetchSavedInvoices();
  }, []);

  // Handle pre-selected appointment from external navigation
  useEffect(() => {
    if (preSelectedAppointmentId && appointments.length > 0) {
      const apt = appointments.find(a => a.id === preSelectedAppointmentId);
      if (apt) {
        handleSelectAppointment(preSelectedAppointmentId);
        setActiveTab("create");
        if (onClearSelection) {
          onClearSelection();
        }
      }
    }
  }, [preSelectedAppointmentId, appointments]);

  const fetchSavedInvoices = async () => {
    const { data, error } = await supabase
      .from("invoices")
      .select("id, invoice_number, customer_name, total, status, created_at")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setSavedInvoices(data);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchCompanyInfo();
  }, []);

  const fetchAppointments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("appointments")
      .select("id, reference_id, appointment_date, appointment_time, status, notes, user_id, service_id")
      .eq("status", "completed")
      .order("appointment_date", { ascending: false });

    if (error) {
      toast({ title: "Error", description: "Failed to fetch appointments", variant: "destructive" });
      setLoading(false);
      return;
    }

    // Fetch user and service details
    const appointmentsWithDetails: Appointment[] = [];
    for (const apt of data || []) {
      let profile = { full_name: null as string | null, email: null as string | null, phone: null as string | null, address: null as string | null };
      
      if (apt.user_id) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("full_name, email, phone, address")
          .eq("user_id", apt.user_id)
          .maybeSingle();
        if (profileData) profile = profileData;
      } else {
        // Parse guest details from notes for guest bookings
        const notes = apt.notes || "";
        const nameMatch = notes.match(/Name=([^,|]+)/i);
        const emailMatch = notes.match(/Email=([^,|]+)/i);
        const phoneMatch = notes.match(/Phone=([^,|]+)/i);
        
        profile = {
          full_name: nameMatch ? nameMatch[1].trim() : "Guest",
          email: emailMatch ? emailMatch[1].trim() : null,
          phone: phoneMatch ? phoneMatch[1].trim() : null,
          address: null,
        };
      }

      const { data: service } = apt.service_id
        ? await supabase.from("services").select("name, price").eq("id", apt.service_id).maybeSingle()
        : { data: null };

      appointmentsWithDetails.push({
        ...apt,
        user: profile,
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

  const generateInvoiceNumber = async () => {
    // Get current financial year (April to March)
    const now = new Date();
    const year = now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
    const nextYear = (year + 1).toString().slice(-2);
    const currentYear = year.toString().slice(-2);
    const prefix = `Inv-${currentYear}-${nextYear}/KTS`;
    
    // Get the latest invoice number with this prefix to determine serial
    const { data: latestInvoice } = await supabase
      .from("invoices")
      .select("invoice_number")
      .ilike("invoice_number", `${prefix}-%`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    
    let serialNumber = 1;
    if (latestInvoice?.invoice_number) {
      const match = latestInvoice.invoice_number.match(/-(\d{3})$/);
      if (match) {
        serialNumber = parseInt(match[1]) + 1;
      }
    }
    
    return `${prefix}-${serialNumber.toString().padStart(3, '0')}`;
  };

  // Parse discount from appointment notes
  const parseDiscountFromNotes = (notes: string | null): { discountPercent: number; couponCode: string | null } => {
    if (!notes) return { discountPercent: 0, couponCode: null };
    
    // Match pattern like "Coupon: CODE (XX% off)"
    const couponMatch = notes.match(/Coupon:\s*(\w+)\s*\((\d+)%\s*off\)/i);
    if (couponMatch) {
      return { discountPercent: parseInt(couponMatch[2]), couponCode: couponMatch[1] };
    }
    
    // Match pattern like "XX% discount"
    const discountMatch = notes.match(/(\d+)%\s*discount/i);
    if (discountMatch) {
      return { discountPercent: parseInt(discountMatch[1]), couponCode: null };
    }
    
    return { discountPercent: 0, couponCode: null };
  };

  const handleSelectAppointment = async (appointmentId: string) => {
    setSelectedAppointment(appointmentId);
    const apt = appointments.find((a) => a.id === appointmentId);
    if (apt) {
      const servicePrice = apt.service?.price || 0;
      const { discountPercent, couponCode } = parseDiscountFromNotes(apt.notes);
      
      // Calculate discounted price
      const discountAmount = (servicePrice * discountPercent) / 100;
      const finalServicePrice = servicePrice - discountAmount;
      
      const items: InvoiceItem[] = apt.service
        ? [
            {
              description: apt.service.name + (discountPercent > 0 ? ` (${discountPercent}% discount${couponCode ? ` - ${couponCode}` : ''})` : ''),
              quantity: 1,
              rate: finalServicePrice,
              amount: finalServicePrice,
            },
          ]
        : [];

      const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
      const taxAmount = (subtotal * invoice.taxRate) / 100;
      const total = subtotal + taxAmount;

      const invoiceNumber = await generateInvoiceNumber();

      setInvoice({
        ...invoice,
        invoiceNumber,
        customerName: apt.user.full_name || "",
        customerEmail: apt.user.email || "",
        customerPhone: apt.user.phone || "",
        customerAddress: apt.user.address || "",
        items,
        subtotal,
        taxAmount,
        discount: discountAmount,
        discountPercent,
        couponCode,
        total,
        notes: `Appointment Reference: ${apt.reference_id || apt.id}\nDate: ${format(new Date(apt.appointment_date), "PPP")}\nTime: ${apt.appointment_time}${discountPercent > 0 ? `\nDiscount Applied: ${discountPercent}%${couponCode ? ` (Code: ${couponCode})` : ''}` : ''}`,
      });
    }
  };

  const handleSaveInvoice = async () => {
    if (!invoice.invoiceNumber || !invoice.customerName) {
      toast({ title: "Error", description: "Please generate an invoice first", variant: "destructive" });
      return;
    }

    setSaving(true);
    const { data: user } = await supabase.auth.getUser();
    
    const { error } = await supabase.from("invoices").insert({
      invoice_number: invoice.invoiceNumber,
      appointment_id: selectedAppointment || null,
      customer_name: invoice.customerName,
      customer_email: invoice.customerEmail,
      customer_phone: invoice.customerPhone,
      customer_address: invoice.customerAddress,
      items: invoice.items,
      subtotal: invoice.subtotal,
      tax_rate: invoice.taxRate,
      tax_amount: invoice.taxAmount,
      discount: invoice.discount,
      discount_percent: invoice.discountPercent,
      coupon_code: invoice.couponCode,
      total: invoice.total,
      notes: invoice.notes,
      terms: invoice.terms,
      status: "saved",
      created_by: user?.user?.id,
    });

    setSaving(false);

    if (error) {
      toast({ title: "Error", description: "Failed to save invoice", variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: "Invoice saved successfully!" });
    fetchSavedInvoices();
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!isSuperAdmin) {
      toast({ title: "Access Denied", description: "Only Super Admins can delete invoices", variant: "destructive" });
      return;
    }

    setDeleting(invoiceId);
    const { error } = await supabase.from("invoices").delete().eq("id", invoiceId);
    setDeleting(null);

    if (error) {
      toast({ title: "Error", description: "Failed to delete invoice", variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: "Invoice deleted successfully!" });
    fetchSavedInvoices();
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

  const getTemplateStyles = (template: InvoiceTemplate) => {
    switch (template) {
      case "classic":
        return `
          * { box-sizing: border-box; }
          body { font-family: 'Georgia', serif; padding: 0; margin: 0; color: #333; background: #f0f4f8; }
          .invoice-wrapper { max-width: 800px; margin: 20px auto; background: white; border: 1px solid #1e40af; border-radius: 8px; overflow: hidden; }
          .invoice-header { background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 30px; display: flex; justify-content: space-between; align-items: flex-start; }
          .company-info h1 { margin: 0 0 8px; font-size: 26px; font-weight: 700; }
          .company-info p { margin: 2px 0; font-size: 13px; opacity: 0.95; }
          .invoice-badge { background: white; color: #1e40af; padding: 20px 25px; text-align: right; border-radius: 6px; }
          .invoice-badge h2 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 1px; }
          .invoice-badge .invoice-number { font-size: 13px; font-weight: 600; margin-top: 5px; color: #64748b; }
          .invoice-badge .dates { margin-top: 10px; font-size: 11px; color: #94a3b8; }
          .invoice-body { padding: 30px; }
          .bill-to-section { margin-bottom: 25px; padding-bottom: 20px; border-bottom: 2px solid #e2e8f0; }
          .bill-to h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #1e40af; margin: 0 0 10px; font-weight: 600; }
          .bill-to .name { font-size: 17px; font-weight: 600; margin-bottom: 5px; color: #1e293b; }
          .bill-to p { margin: 2px 0; font-size: 13px; color: #64748b; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
          .items-table th { background: #eff6ff; padding: 12px 14px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #1e40af; font-weight: 600; border-bottom: 2px solid #1e40af; }
          .items-table th:last-child, .items-table td:last-child { text-align: right; }
          .items-table td { padding: 14px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
          .totals-section { display: flex; justify-content: flex-end; }
          .totals-box { width: 260px; }
          .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; border-bottom: 1px solid #e2e8f0; }
          .totals-row.total { border-top: 2px solid #1e40af; border-bottom: none; padding-top: 12px; margin-top: 5px; font-size: 18px; font-weight: 700; color: #1e40af; }
          .footer-section { margin-top: 30px; padding-top: 20px; border-top: 2px solid #e2e8f0; display: grid; grid-template-columns: 1fr 1fr; gap: 25px; }
          .footer-box h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #1e40af; margin: 0 0 8px; font-weight: 600; }
          .footer-box p { font-size: 11px; color: #64748b; margin: 0; line-height: 1.5; white-space: pre-line; }
          .thank-you { text-align: center; padding: 20px; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); font-size: 13px; font-weight: 600; color: white; }
        `;
      case "minimal":
        return `
          * { box-sizing: border-box; }
          body { font-family: 'Helvetica Neue', Arial, sans-serif; padding: 0; margin: 0; color: #374151; background: #fafafa; }
          .invoice-wrapper { max-width: 800px; margin: 20px auto; background: white; border: 1px solid #e5e7eb; border-radius: 4px; }
          .invoice-header { padding: 40px; display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #e5e7eb; }
          .company-info h1 { margin: 0 0 12px; font-size: 24px; font-weight: 500; color: #111827; }
          .company-info p { margin: 3px 0; font-size: 12px; color: #6b7280; }
          .invoice-badge { text-align: right; }
          .invoice-badge h2 { margin: 0; font-size: 14px; font-weight: 500; letter-spacing: 2px; color: #9ca3af; text-transform: uppercase; }
          .invoice-badge .invoice-number { font-size: 20px; font-weight: 600; margin-top: 8px; color: #111827; }
          .invoice-badge .dates { margin-top: 15px; font-size: 12px; color: #6b7280; }
          .invoice-body { padding: 40px; }
          .bill-to-section { margin-bottom: 35px; }
          .bill-to h3 { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #9ca3af; margin: 0 0 12px; font-weight: 500; }
          .bill-to .name { font-size: 16px; font-weight: 500; margin-bottom: 6px; color: #111827; }
          .bill-to p { margin: 2px 0; font-size: 13px; color: #6b7280; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 35px; }
          .items-table th { padding: 12px 0; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; font-weight: 500; border-bottom: 1px solid #e5e7eb; }
          .items-table th:last-child, .items-table td:last-child { text-align: right; }
          .items-table td { padding: 16px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; color: #374151; }
          .totals-section { display: flex; justify-content: flex-end; }
          .totals-box { width: 240px; }
          .totals-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 13px; color: #6b7280; }
          .totals-row.total { border-top: 1px solid #e5e7eb; padding-top: 12px; margin-top: 8px; font-size: 18px; font-weight: 600; color: #111827; }
          .footer-section { margin-top: 40px; padding-top: 25px; border-top: 1px solid #e5e7eb; display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
          .footer-box h4 { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; margin: 0 0 10px; font-weight: 500; }
          .footer-box p { font-size: 12px; color: #6b7280; margin: 0; line-height: 1.6; white-space: pre-line; }
          .thank-you { text-align: center; padding: 25px; border-top: 1px solid #e5e7eb; font-size: 13px; font-weight: 500; color: #6b7280; }
        `;
      default: // modern
        return `
          * { box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; padding: 0; margin: 0; color: #1a1a1a; background: #f5f5f5; }
          .invoice-wrapper { max-width: 800px; margin: 20px auto; background: white; border: 3px solid #1a1a1a; border-radius: 0; }
          .invoice-header { background: linear-gradient(135deg, #1a1a1a 0%, #333 100%); color: white; padding: 30px; display: flex; justify-content: space-between; align-items: flex-start; }
          .company-info h1 { margin: 0 0 8px; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
          .company-info p { margin: 2px 0; font-size: 13px; opacity: 0.9; }
          .invoice-badge { background: white; color: #1a1a1a; padding: 20px 25px; text-align: right; }
          .invoice-badge h2 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 2px; }
          .invoice-badge .invoice-number { font-size: 14px; font-weight: 600; margin-top: 5px; color: #666; }
          .invoice-badge .dates { margin-top: 12px; font-size: 12px; color: #888; }
          .invoice-body { padding: 30px; }
          .bill-to-section { display: flex; justify-content: space-between; margin-bottom: 30px; padding-bottom: 25px; border-bottom: 2px solid #e5e5e5; }
          .bill-to h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin: 0 0 10px; font-weight: 600; }
          .bill-to .name { font-size: 18px; font-weight: 600; margin-bottom: 5px; }
          .bill-to p { margin: 2px 0; font-size: 13px; color: #555; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .items-table th { background: #f8f8f8; padding: 14px 16px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #666; font-weight: 600; border-top: 2px solid #1a1a1a; border-bottom: 2px solid #1a1a1a; }
          .items-table th:last-child, .items-table td:last-child { text-align: right; }
          .items-table td { padding: 16px; border-bottom: 1px solid #eee; font-size: 14px; }
          .totals-section { display: flex; justify-content: flex-end; }
          .totals-box { width: 280px; }
          .totals-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 14px; border-bottom: 1px solid #eee; }
          .totals-row.total { border-top: 2px solid #1a1a1a; border-bottom: none; padding-top: 15px; margin-top: 5px; font-size: 20px; font-weight: 700; }
          .footer-section { margin-top: 40px; padding-top: 25px; border-top: 2px solid #e5e5e5; display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }
          .footer-box h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin: 0 0 8px; font-weight: 600; }
          .footer-box p { font-size: 12px; color: #555; margin: 0; line-height: 1.6; white-space: pre-line; }
          .thank-you { text-align: center; padding: 25px; background: #f8f8f8; border-top: 2px solid #1a1a1a; font-size: 14px; font-weight: 600; color: #333; }
        `;
    }
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
          <style>${getTemplateStyles(selectedTemplate)}</style>
        </head>
        <body>
          <div class="invoice-wrapper">
            <div class="invoice-header">
              <div class="company-info">
                <h1>${companyInfo.name}</h1>
                <p>${companyInfo.address}</p>
                <p>${companyInfo.email}</p>
                <p>${companyInfo.phone}</p>
                ${companyInfo.gst ? `<p>GST: ${companyInfo.gst}</p>` : ''}
              </div>
              <div class="invoice-badge">
                <h2>INVOICE</h2>
                <div class="invoice-number">#${invoice.invoiceNumber}</div>
                <div class="dates">
                  <div>Date: ${format(new Date(invoice.invoiceDate), "PPP")}</div>
                  <div>Due: ${format(new Date(invoice.dueDate), "PPP")}</div>
                </div>
              </div>
            </div>
            <div class="invoice-body">
              <div class="bill-to-section">
                <div class="bill-to">
                  <h3>Bill To</h3>
                  <div class="name">${invoice.customerName}</div>
                  <p>${invoice.customerEmail}</p>
                  <p>${invoice.customerPhone}</p>
                  <p>${invoice.customerAddress}</p>
                </div>
              </div>
              <table class="items-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Qty</th>
                    <th>Rate</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${invoice.items.map(item => `
                    <tr>
                      <td>${item.description}</td>
                      <td>${item.quantity}</td>
                      <td>₹${item.rate.toLocaleString()}</td>
                      <td>₹${item.amount.toLocaleString()}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              <div class="totals-section">
                <div class="totals-box">
                  <div class="totals-row"><span>Subtotal</span><span>₹${invoice.subtotal.toLocaleString()}</span></div>
                  <div class="totals-row"><span>Tax (${invoice.taxRate}%)</span><span>₹${invoice.taxAmount.toLocaleString()}</span></div>
                  ${invoice.discount > 0 ? `<div class="totals-row"><span>Discount</span><span>-₹${invoice.discount.toLocaleString()}</span></div>` : ''}
                  <div class="totals-row total"><span>Total</span><span>₹${invoice.total.toLocaleString()}</span></div>
                </div>
              </div>
              <div class="footer-section">
                <div class="footer-box">
                  <h4>Notes</h4>
                  <p>${invoice.notes || 'N/A'}</p>
                </div>
                <div class="footer-box">
                  <h4>Terms & Conditions</h4>
                  <p>${invoice.terms}</p>
                </div>
              </div>
            </div>
            <div class="thank-you">Thank you for your business!</div>
          </div>
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
          <p className="text-muted-foreground">Create and manage invoices for appointments</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Palette className="w-4 h-4 mr-2" />
                Template: {selectedTemplate.charAt(0).toUpperCase() + selectedTemplate.slice(1)}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSelectedTemplate("modern")}>
                Modern (Dark Header)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedTemplate("classic")}>
                Classic (Blue Theme)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSelectedTemplate("minimal")}>
                Minimal (Clean)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant={activeTab === "create" ? "default" : "outline"}
            onClick={() => setActiveTab("create")}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create
          </Button>
          <Button
            variant={activeTab === "history" ? "default" : "outline"}
            onClick={() => setActiveTab("history")}
          >
            <History className="w-4 h-4 mr-2" />
            History ({savedInvoices.length})
          </Button>
        </div>
      </div>

      {activeTab === "history" ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="w-5 h-5" />
              Saved Invoices
            </CardTitle>
          </CardHeader>
          <CardContent>
            {savedInvoices.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No invoices saved yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    {isSuperAdmin && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {savedInvoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                      <TableCell>{inv.customer_name}</TableCell>
                      <TableCell>₹{Number(inv.total).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={inv.status === "paid" ? "default" : "secondary"}>
                          {inv.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(inv.created_at), "PPP")}</TableCell>
                      {isSuperAdmin && (
                        <TableCell className="text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-destructive hover:text-destructive"
                                disabled={deleting === inv.id}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete invoice {inv.invoice_number}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  onClick={() => handleDeleteInvoice(inv.id)}
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : (
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
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle>Invoice Preview</CardTitle>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={handleSaveInvoice} disabled={saving}>
                    <Save className="w-4 h-4 mr-1" />
                    {saving ? "Saving..." : "Save Invoice"}
                  </Button>
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
              <div ref={invoiceRef} className={`bg-white text-gray-900 rounded-lg overflow-hidden ${
                selectedTemplate === "modern" ? "border-[3px] border-gray-900" : 
                selectedTemplate === "classic" ? "border border-blue-600 rounded-lg" : 
                "border border-gray-200 rounded"
              }`}>
                {/* Template-Aware Header */}
                <div className={`p-6 flex justify-between items-start ${
                  selectedTemplate === "modern" ? "bg-gradient-to-r from-gray-900 to-gray-700 text-white" :
                  selectedTemplate === "classic" ? "bg-gradient-to-r from-blue-700 to-blue-500 text-white" :
                  "border-b border-gray-200 bg-white"
                }`}>
                  <div className="company-info">
                    <h1 className={`font-bold tracking-tight ${
                      selectedTemplate === "minimal" ? "text-xl text-gray-900" : "text-2xl"
                    }`}>{companyInfo.name}</h1>
                    <p className={`text-sm mt-1 ${selectedTemplate === "minimal" ? "text-gray-500" : "opacity-90"}`}>{companyInfo.address}</p>
                    <p className={`text-sm ${selectedTemplate === "minimal" ? "text-gray-500" : "opacity-90"}`}>{companyInfo.email}</p>
                    <p className={`text-sm ${selectedTemplate === "minimal" ? "text-gray-500" : "opacity-90"}`}>{companyInfo.phone}</p>
                    {companyInfo.gst && <p className={`text-sm ${selectedTemplate === "minimal" ? "text-gray-500" : "opacity-90"}`}>GST: {companyInfo.gst}</p>}
                  </div>
                  <div className={`px-5 py-4 text-right ${
                    selectedTemplate === "modern" ? "bg-white text-gray-900 rounded-sm" :
                    selectedTemplate === "classic" ? "bg-white text-blue-700 rounded-md" :
                    ""
                  }`}>
                    <h2 className={`font-extrabold tracking-widest ${
                      selectedTemplate === "minimal" ? "text-sm text-gray-400 uppercase" : "text-xl"
                    }`}>INVOICE</h2>
                    <p className={`font-semibold mt-1 ${
                      selectedTemplate === "minimal" ? "text-lg text-gray-900" : "text-sm text-gray-600"
                    }`}>#{invoice.invoiceNumber}</p>
                    <div className={`mt-3 text-xs ${
                      selectedTemplate === "minimal" ? "text-gray-500" : "text-gray-500"
                    }`}>
                      <p>Date: {format(new Date(invoice.invoiceDate), "PPP")}</p>
                      <p>Due: {format(new Date(invoice.dueDate), "PPP")}</p>
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-6">
                  {/* Bill To Section */}
                  <div className={`mb-6 pb-5 ${
                    selectedTemplate === "minimal" ? "" : "border-b-2 border-gray-200"
                  }`}>
                    <h3 className={`text-[11px] uppercase tracking-wider font-semibold mb-2 ${
                      selectedTemplate === "classic" ? "text-blue-600" :
                      selectedTemplate === "minimal" ? "text-gray-400 tracking-widest" :
                      "text-gray-500"
                    }`}>Bill To</h3>
                    <p className="text-lg font-semibold">{invoice.customerName}</p>
                    <p className="text-sm text-gray-600">{invoice.customerEmail}</p>
                    <p className="text-sm text-gray-600">{invoice.customerPhone}</p>
                    <p className="text-sm text-gray-600">{invoice.customerAddress}</p>
                  </div>

                  {/* Items Table */}
                  <table className="w-full mb-6">
                    <thead>
                      <tr className={`${
                        selectedTemplate === "modern" ? "border-y-2 border-gray-900" :
                        selectedTemplate === "classic" ? "border-b-2 border-blue-600" :
                        "border-b border-gray-200"
                      }`}>
                        <th className={`py-3 px-4 text-left text-[11px] uppercase tracking-wide font-semibold ${
                          selectedTemplate === "modern" ? "bg-gray-50 text-gray-600" :
                          selectedTemplate === "classic" ? "bg-blue-50 text-blue-700" :
                          "text-gray-400"
                        }`}>Description</th>
                        <th className={`py-3 px-4 text-right text-[11px] uppercase tracking-wide font-semibold ${
                          selectedTemplate === "modern" ? "bg-gray-50 text-gray-600" :
                          selectedTemplate === "classic" ? "bg-blue-50 text-blue-700" :
                          "text-gray-400"
                        }`}>Qty</th>
                        <th className={`py-3 px-4 text-right text-[11px] uppercase tracking-wide font-semibold ${
                          selectedTemplate === "modern" ? "bg-gray-50 text-gray-600" :
                          selectedTemplate === "classic" ? "bg-blue-50 text-blue-700" :
                          "text-gray-400"
                        }`}>Rate</th>
                        <th className={`py-3 px-4 text-right text-[11px] uppercase tracking-wide font-semibold ${
                          selectedTemplate === "modern" ? "bg-gray-50 text-gray-600" :
                          selectedTemplate === "classic" ? "bg-blue-50 text-blue-700" :
                          "text-gray-400"
                        }`}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.items.map((item, index) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-4 px-4 text-sm">{item.description}</td>
                          <td className="py-4 px-4 text-sm text-right">{item.quantity}</td>
                          <td className="py-4 px-4 text-sm text-right">₹{item.rate.toLocaleString()}</td>
                          <td className="py-4 px-4 text-sm text-right font-medium">₹{item.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Totals */}
                  <div className="flex justify-end">
                    <div className="w-72">
                      <div className="flex justify-between py-2 text-sm border-b border-gray-100">
                        <span className="text-gray-600">Subtotal</span>
                        <span>₹{invoice.subtotal.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-2 text-sm border-b border-gray-100">
                        <span className="text-gray-600">Tax ({invoice.taxRate}%)</span>
                        <span>₹{invoice.taxAmount.toLocaleString()}</span>
                      </div>
                      {invoice.discount > 0 && (
                        <div className="flex justify-between py-2 text-sm border-b border-gray-100 text-green-600">
                          <span>Discount</span>
                          <span>-₹{invoice.discount.toLocaleString()}</span>
                        </div>
                      )}
                      <div className={`flex justify-between py-4 mt-1 text-xl font-bold ${
                        selectedTemplate === "modern" ? "border-t-2 border-gray-900" :
                        selectedTemplate === "classic" ? "border-t-2 border-blue-600 text-blue-700" :
                        "border-t border-gray-200"
                      }`}>
                        <span>Total</span>
                        <span>₹{invoice.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="mt-8 pt-6 border-t-2 border-gray-200 grid grid-cols-2 gap-6">
                    {invoice.notes && (
                      <div>
                        <h4 className={`text-[11px] uppercase tracking-wider font-semibold mb-2 ${
                          selectedTemplate === "classic" ? "text-blue-600" : "text-gray-500"
                        }`}>Notes</h4>
                        <p className="text-xs text-gray-600 whitespace-pre-line leading-relaxed">{invoice.notes}</p>
                      </div>
                    )}
                    <div>
                      <h4 className={`text-[11px] uppercase tracking-wider font-semibold mb-2 ${
                        selectedTemplate === "classic" ? "text-blue-600" : "text-gray-500"
                      }`}>Terms & Conditions</h4>
                      <p className="text-xs text-gray-600 leading-relaxed">{invoice.terms}</p>
                    </div>
                  </div>
                </div>

                {/* Thank You */}
                <div className={`py-4 text-center ${
                  selectedTemplate === "modern" ? "bg-gray-50 border-t-2 border-gray-900" :
                  selectedTemplate === "classic" ? "bg-gradient-to-r from-blue-700 to-blue-500 text-white" :
                  "border-t border-gray-200"
                }`}>
                  <p className={`text-sm font-semibold ${
                    selectedTemplate === "minimal" ? "text-gray-500" : 
                    selectedTemplate === "modern" ? "text-gray-700" : ""
                  }`}>Thank you for your business!</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      )}
    </div>
  );
};

export default AdminInvoices;
