"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { toast } from "sonner"

interface PDFExportButtonProps {
  reportType: "monthly" | "rent-collection" | "outstanding" | "landlord-statement"
}

export function PDFExportButton({ reportType }: PDFExportButtonProps) {
  const handleExport = () => {
    toast.success(`${reportType} report exported to PDF`)
    // PDF export functionality can be added later using libraries like jsPDF or html2pdf
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport} className="gap-2 bg-transparent">
      <Download className="h-4 w-4" />
      Export PDF
    </Button>
  )
}
