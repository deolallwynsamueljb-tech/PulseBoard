import { useCallback } from "react";

export function useExport() {
  const exportPDF = useCallback(async (elementId, filename = "agriintel-report") => {
    const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
      import("jspdf"),
      import("html2canvas"),
    ]);
    const el = document.getElementById(elementId);
    if (!el) return;
    const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: "#09090b" });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [canvas.width / 2, canvas.height / 2] });
    pdf.addImage(img, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
    pdf.save(`${filename}-${new Date().toISOString().slice(0, 10)}.pdf`);
  }, []);

  const exportExcel = useCallback(async (rows, headers, filename = "agriintel-data") => {
    const { utils, writeFile } = await import("xlsx");
    const ws = utils.json_to_sheet(rows);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Data");
    if (headers) utils.sheet_add_aoa(ws, [headers], { origin: "A1" });
    writeFile(wb, `${filename}-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }, []);

  return { exportPDF, exportExcel };
}
