import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import type { forms, formResponses } from '@shared/schema';

type Form = typeof forms.$inferSelect & {
  questions: Array<{
    id: string;
    type: string;
    title: string;
    options?: string[];
    required?: boolean;
  }>;
};

type FormResponse = typeof formResponses.$inferSelect & {
  responseData?: Record<string, any>;
};

interface ExportData {
  form: Form;
  responses: FormResponse[];
}

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export async function exportToPDF(data: ExportData) {
  const { form, responses } = data;
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.text(form.title, 20, 30);
  
  // Add description
  if (form.description) {
    doc.setFontSize(12);
    doc.text(form.description, 20, 45);
  }
  
  // Add form metadata
  doc.setFontSize(10);
  doc.text(`Created: ${form.createdAt ? new Date(form.createdAt).toLocaleDateString() : 'N/A'}`, 20, 60);
  doc.text(`Total Responses: ${responses.length}`, 20, 70);
  
  let yPosition = 90;
  
  // Add responses
  responses.forEach((response, index) => {
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 30;
    }
    
    // Response header
    doc.setFontSize(14);
    doc.text(`Response #${index + 1}`, 20, yPosition);
    doc.setFontSize(10);
    doc.text(`Submitted: ${response.submittedAt ? new Date(response.submittedAt).toLocaleDateString() : 'N/A'}`, 20, yPosition + 10);
    doc.text(`Status: ${response.status}`, 20, yPosition + 20);
    
    yPosition += 35;
    
    // Response data
    if (response.responseData) {
      const tableData = Object.entries(response.responseData || {}).map(([questionId, answer]) => {
        const question = form.questions.find((q: any) => q.id === questionId);
        return [
          question?.title || questionId,
          typeof answer === 'object' ? JSON.stringify(answer) : String(answer)
        ];
      });
      
      doc.autoTable({
        startY: yPosition,
        head: [['Question', 'Answer']],
        body: tableData,
        margin: { left: 20, right: 20 },
        styles: { fontSize: 9 },
        headStyles: { fillColor: [102, 51, 153] },
      });
      
      yPosition = (doc as any).lastAutoTable.finalY + 20;
    }
  });
  
  // Save PDF
  doc.save(`${form.title.replace(/[^a-zA-Z0-9]/g, '_')}_responses.pdf`);
}

export async function exportToWord(data: ExportData) {
  const { form, responses } = data;
  
  const doc = new Document({
    sections: [
      {
        children: [
          // Title
          new Paragraph({
            children: [
              new TextRun({
                text: form.title,
                bold: true,
                size: 32,
              }),
            ],
            heading: HeadingLevel.TITLE,
          }),
          
          // Description
          ...(form.description ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: form.description,
                  size: 24,
                }),
              ],
            }),
          ] : []),
          
          // Metadata
          new Paragraph({
            children: [
              new TextRun({
                text: `Created: ${form.createdAt ? new Date(form.createdAt).toLocaleDateString() : 'N/A'}`,
                size: 20,
              }),
            ],
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: `Total Responses: ${responses.length}`,
                size: 20,
              }),
            ],
          }),
          
          new Paragraph({ text: "" }), // Empty line
          
          // Responses
          ...responses.flatMap((response, index) => [
            new Paragraph({
              children: [
                new TextRun({
                  text: `Response #${index + 1}`,
                  bold: true,
                  size: 24,
                }),
              ],
              heading: HeadingLevel.HEADING_2,
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: `Submitted: ${response.submittedAt ? new Date(response.submittedAt).toLocaleDateString() : 'N/A'}`,
                  size: 20,
                }),
              ],
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: `Status: ${response.status}`,
                  size: 20,
                }),
              ],
            }),
            
            // Response table
            new Table({
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ text: "Question", alignment: AlignmentType.CENTER })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ text: "Answer", alignment: AlignmentType.CENTER })],
                    }),
                  ],
                }),
                ...Object.entries(response.responseData || {}).map(([questionId, answer]) => {
                  const question = form.questions.find((q: any) => q.id === questionId);
                  return new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({ text: question?.title || questionId })],
                      }),
                      new TableCell({
                        children: [new Paragraph({ 
                          text: typeof answer === 'object' ? JSON.stringify(answer) : String(answer) 
                        })],
                      }),
                    ],
                  });
                }),
              ],
            }),
            
            new Paragraph({ text: "" }), // Empty line between responses
          ]),
        ],
      },
    ],
  });
  
  // Generate and save document
  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${form.title.replace(/[^a-zA-Z0-9]/g, '_')}_responses.docx`);
}

export async function exportFormSummary(data: ExportData, format: 'pdf' | 'word') {
  if (format === 'pdf') {
    await exportToPDF(data);
  } else {
    await exportToWord(data);
  }
}