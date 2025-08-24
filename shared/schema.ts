import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb, boolean, integer } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const forms = pgTable("forms", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  questions: jsonb("questions").notNull().default([]),
  workflowConfig: jsonb("workflow_config").notNull().default({}),
  isPublished: boolean("is_published").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const formResponses = pgTable("form_responses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  formId: varchar("form_id").notNull().references(() => forms.id),
  respondentEmail: varchar("respondent_email"),
  respondentName: varchar("respondent_name"),
  responses: jsonb("responses").notNull().default({}),
  aiEnhancedResponses: jsonb("ai_enhanced_responses").default({}),
  status: varchar("status").notNull().default("submitted"), // submitted, approved, rejected
  submittedAt: timestamp("submitted_at").defaultNow(),
  reviewedAt: timestamp("reviewed_at"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
});

export const aiPrompts = pgTable("ai_prompts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  questionId: varchar("question_id").notNull(),
  formId: varchar("form_id").notNull().references(() => forms.id),
  prompt: text("prompt").notNull(),
  tone: varchar("tone").default("professional"),
  length: varchar("length").default("moderate"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  forms: many(forms),
  reviewedResponses: many(formResponses),
}));

export const formsRelations = relations(forms, ({ one, many }) => ({
  creator: one(users, {
    fields: [forms.createdBy],
    references: [users.id],
  }),
  responses: many(formResponses),
  aiPrompts: many(aiPrompts),
}));

export const formResponsesRelations = relations(formResponses, ({ one }) => ({
  form: one(forms, {
    fields: [formResponses.formId],
    references: [forms.id],
  }),
  reviewer: one(users, {
    fields: [formResponses.reviewedBy],
    references: [users.id],
  }),
}));

export const aiPromptsRelations = relations(aiPrompts, ({ one }) => ({
  form: one(forms, {
    fields: [aiPrompts.formId],
    references: [forms.id],
  }),
}));

// Schemas
export const insertFormSchema = createInsertSchema(forms).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFormResponseSchema = createInsertSchema(formResponses).omit({
  id: true,
  submittedAt: true,
  reviewedAt: true,
});

export const insertAiPromptSchema = createInsertSchema(aiPrompts).omit({
  id: true,
  createdAt: true,
});

export const updateFormSchema = insertFormSchema.partial();

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Form = typeof forms.$inferSelect;
export type InsertForm = z.infer<typeof insertFormSchema>;
export type UpdateForm = z.infer<typeof updateFormSchema>;
export type FormResponse = typeof formResponses.$inferSelect;
export type InsertFormResponse = z.infer<typeof insertFormResponseSchema>;
export type AiPrompt = typeof aiPrompts.$inferSelect;
export type InsertAiPrompt = z.infer<typeof insertAiPromptSchema>;

// Question types
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
