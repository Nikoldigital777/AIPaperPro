import { z } from "zod";

export const questionTypeSchema = z.enum([
  "multiple-choice",
  "checkboxes", 
  "text-field",
  "long-text",
  "number",
  "date"
]);

export const questionSchema = z.object({
  id: z.string(),
  type: questionTypeSchema,
  title: z.string(),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  aiPrompt: z.object({
    prompt: z.string(),
    tone: z.enum(["professional", "casual", "formal", "creative"]).default("professional"),
    length: z.enum(["concise", "moderate", "detailed"]).default("moderate"),
  }).optional(),
});

export const workflowConfigSchema = z.object({
  emailNotifications: z.boolean().default(false),
  slackNotifications: z.boolean().default(false),
  requireApproval: z.boolean().default(false),
  approverEmail: z.string().email().optional(),
});

export type Question = z.infer<typeof questionSchema>;
export type QuestionType = z.infer<typeof questionTypeSchema>;
export type WorkflowConfig = z.infer<typeof workflowConfigSchema>;

export interface FormBuilderState {
  title: string;
  description: string;
  questions: Question[];
  workflowConfig: WorkflowConfig;
}

export interface DraggedItem {
  type: QuestionType;
  id?: string;
}

export interface AIEnhancementOptions {
  tone: 'professional' | 'casual' | 'formal' | 'creative';
  length: 'concise' | 'moderate' | 'detailed';
  customPrompt?: string;
}
