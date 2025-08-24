import jsPDF from "jspdf";
import "jspdf-autotable";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";

export interface ExportSection { 
  heading: string; 
  body: string;
}

// Extend jsPDF type to include autoTable
declare module "jspdf" { 
  interface jsPDF { 
    autoTable: (options: any) => jsPDF;
  } 
}

export function exportToPDF(title: string, sections: ExportSection[]) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  doc.setFont("Helvetica", "normal");
  doc.setFontSize(18);
  doc.text(title, 40, 60);

  let y = 100;
  doc.setFontSize(12);
  sections.forEach((s) => {
    doc.setFont("Helvetica", "bold");
    doc.text(s.heading, 40, y);
    y += 18;
    doc.setFont("Helvetica", "normal");
    const lines = doc.splitTextToSize(s.body, 515);
    for (const line of lines) {
      if (y > 760) { doc.addPage(); y = 60; }
      doc.text(line, 40, y);
      y += 16;
    }
    y += 10;
  });
  doc.save(`${slugify(title)}.pdf`);
}

export async function exportToDocx(title: string, sections: ExportSection[]) {
  const children: Paragraph[] = [
    new Paragraph({ children: [ new TextRun({ text: title, bold: true, size: 32 }) ] }),
  ];
  for (const s of sections) {
    children.push(new Paragraph({ children: [ new TextRun({ text: s.heading, bold: true, size: 26 }) ] }));
    children.push(new Paragraph({ children: [ new TextRun({ text: s.body, size: 22 }) ] }));
  }

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${slugify(title)}.docx`);
}

function slugify(s: string) { 
  return s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "").slice(0, 80); 
}

// Helper functions for form exports
export function exportFormToPDF(formState: any) {
  const sections: ExportSection[] = [
    {
      heading: "Form Description",
      body: formState.description || "No description provided"
    },
    {
      heading: "Questions",
      body: formState.questions.map((q: any, i: number) => 
        `${i + 1}. ${q.title} (${q.type})`
      ).join('\n')
    }
  ];
  
  exportToPDF(formState.title || "Untitled Form", sections);
}

export async function exportFormToDocx(formState: any) {
  const sections: ExportSection[] = [
    {
      heading: "Form Description", 
      body: formState.description || "No description provided"
    },
    {
      heading: "Questions",
      body: formState.questions.map((q: any, i: number) => 
        `${i + 1}. ${q.title} (${q.type})`
      ).join('\n')
    }
  ];
  
  await exportToDocx(formState.title || "Untitled Form", sections);
}