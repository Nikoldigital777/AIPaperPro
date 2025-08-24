import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
import type { forms, formResponses } from '@shared/schema';
import type { FormBuilderState } from './types';

interface ExportSection {
  heading: string;
  body: string;
}

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
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
  sections.forEach(s => {
    doc.setFont("Helvetica", "bold");
    doc.text(s.heading, 40, y);
    y += 18;
    doc.setFont("Helvetica", "normal");
    const lines = doc.splitTextToSize(s.body, 515);
    lines.forEach((line: string) => {
      if (y > 760) { doc.addPage(); y = 60; }
      doc.text(line, 40, y);
      y += 16;
    });
    y += 10;
  });

  doc.save(`${slugify(title)}.pdf`);
}

export async function exportToDocx(title: string, sections: ExportSection[]) {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ 
            children: [new TextRun({ text: title, bold: true, size: 32 })] 
          }),
          ...sections.flatMap(s => [
            new Paragraph({ 
              children: [new TextRun({ text: s.heading, bold: true, size: 24 })] 
            }),
            new Paragraph({
              children: [new TextRun({ text: s.body, size: 22 })],
            }),
          ]),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const blob = new Blob([buffer], { 
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
  });
  saveAs(blob, `${slugify(title)}.docx`);
}

export function exportFormToPDF(formState: FormBuilderState) {
  const sections: ExportSection[] = [
    {
      heading: "Form Description",
      body: formState.description || "No description provided"
    },
    {
      heading: "Questions",
      body: formState.questions.map((q, index) => 
        `${index + 1}. ${q.title} (${q.type}${q.required ? ', required' : ''})`
      ).join('\n')
    },
    {
      heading: "Workflow Configuration",
      body: `
Email Notifications: ${formState.workflowConfig.emailNotifications ? 'Enabled' : 'Disabled'}
Slack Notifications: ${formState.workflowConfig.slackNotifications ? 'Enabled' : 'Disabled'}
Require Approval: ${formState.workflowConfig.requireApproval ? 'Yes' : 'No'}
${formState.workflowConfig.approverEmail ? `Approver Email: ${formState.workflowConfig.approverEmail}` : ''}
      `.trim()
    }
  ];

  exportToPDF(formState.title || 'Untitled Form', sections);
}

export async function exportFormToDocx(formState: FormBuilderState) {
  const sections: ExportSection[] = [
    {
      heading: "Form Description",
      body: formState.description || "No description provided"
    },
    {
      heading: "Questions",
      body: formState.questions.map((q, index) => {
        let questionText = `${index + 1}. ${q.title} (${q.type}${q.required ? ', required' : ''})`;
        if (q.options && q.options.length > 0) {
          questionText += '\nOptions: ' + q.options.join(', ');
        }
        if (q.aiPrompt) {
          questionText += '\nAI Enhancement: Enabled';
        }
        return questionText;
      }).join('\n\n')
    },
    {
      heading: "Workflow Configuration",
      body: `
Email Notifications: ${formState.workflowConfig.emailNotifications ? 'Enabled' : 'Disabled'}
Slack Notifications: ${formState.workflowConfig.slackNotifications ? 'Enabled' : 'Disabled'}
Require Approval: ${formState.workflowConfig.requireApproval ? 'Yes' : 'No'}
${formState.workflowConfig.approverEmail ? `Approver Email: ${formState.workflowConfig.approverEmail}` : ''}
      `.trim()
    }
  ];

  await exportToDocx(formState.title || 'Untitled Form', sections);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}