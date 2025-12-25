import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText, File, Calendar } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from "date-fns";

interface ExportDateRangeProps {
  onExport: (type: 'excel' | 'pdf' | 'word', fromDate: string | null, toDate: string | null) => void;
  disabled?: boolean;
}

const ExportDateRange = ({ onExport, disabled }: ExportDateRangeProps) => {
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [popoverOpen, setPopoverOpen] = useState(false);

  const handleQuickSelect = (preset: string) => {
    const today = new Date();
    let from: Date;
    let to: Date = today;

    switch (preset) {
      case "this_month":
        from = startOfMonth(today);
        to = endOfMonth(today);
        break;
      case "last_month":
        from = startOfMonth(subMonths(today, 1));
        to = endOfMonth(subMonths(today, 1));
        break;
      case "last_3_months":
        from = startOfMonth(subMonths(today, 2));
        to = today;
        break;
      case "last_6_months":
        from = startOfMonth(subMonths(today, 5));
        to = today;
        break;
      case "this_year":
        from = startOfYear(today);
        to = endOfYear(today);
        break;
      case "all":
      default:
        setFromDate("");
        setToDate("");
        return;
    }

    setFromDate(format(from, "yyyy-MM-dd"));
    setToDate(format(to, "yyyy-MM-dd"));
  };

  const handleExport = (type: 'excel' | 'pdf' | 'word') => {
    onExport(type, fromDate || null, toDate || null);
    setPopoverOpen(false);
  };

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Calendar className="w-4 h-4" />
            Export with Date Range
          </div>

          {/* Quick Select Buttons */}
          <div className="flex flex-wrap gap-1">
            <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => handleQuickSelect("all")}>
              All
            </Button>
            <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => handleQuickSelect("this_month")}>
              This Month
            </Button>
            <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => handleQuickSelect("last_month")}>
              Last Month
            </Button>
            <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => handleQuickSelect("last_3_months")}>
              3 Months
            </Button>
            <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => handleQuickSelect("last_6_months")}>
              6 Months
            </Button>
            <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => handleQuickSelect("this_year")}>
              This Year
            </Button>
          </div>

          {/* Date Range Inputs */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">From Date</Label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To Date</Label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          {fromDate && toDate && (
            <p className="text-xs text-muted-foreground">
              Exporting: {format(new Date(fromDate), "MMM d, yyyy")} - {format(new Date(toDate), "MMM d, yyyy")}
            </p>
          )}

          {/* Export Format Buttons */}
          <div className="flex gap-2 pt-2 border-t">
            <Button size="sm" className="flex-1" onClick={() => handleExport('excel')}>
              <FileSpreadsheet className="w-3 h-3 mr-1" />
              Excel
            </Button>
            <Button size="sm" variant="outline" className="flex-1" onClick={() => handleExport('pdf')}>
              <FileText className="w-3 h-3 mr-1" />
              PDF
            </Button>
            <Button size="sm" variant="outline" className="flex-1" onClick={() => handleExport('word')}>
              <File className="w-3 h-3 mr-1" />
              Word
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ExportDateRange;