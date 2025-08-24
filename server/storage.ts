import {
  users,
  forms,
  formResponses,
  aiPrompts,
  type User,
  type InsertUser,
  type Form,
  type InsertForm,
  type UpdateForm,
  type FormResponse,
  type InsertFormResponse,
  type AiPrompt,
  type InsertAiPrompt,
} from "@shared/schema";
import { db } from "./db";
import { and, desc, eq } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: InsertUser): Promise<User>;

  createForm(form: InsertForm): Promise<Form>;
  getForm(id: string): Promise<Form | undefined>;
  getFormsByUser(userId: string): Promise<Form[]>;
  updateForm(id: string, updates: UpdateForm): Promise<Form>;
  deleteForm(id: string): Promise<void>;

  createFormResponse(response: InsertFormResponse): Promise<FormResponse>;
  getFormResponses(formId: string): Promise<FormResponse[]>;
  getFormResponse(id: string): Promise<FormResponse | undefined>;
  updateFormResponseStatus(id: string, status: string, reviewedBy?: string): Promise<FormResponse>;
  updateFormResponseAiEnhanced(id: string, aiEnhancedResponses: any): Promise<FormResponse>;

  createAiPrompt(prompt: InsertAiPrompt): Promise<AiPrompt>;
  getAiPrompt(questionId: string, formId: string): Promise<AiPrompt | undefined>;
  updateAiPrompt(questionId: string, formId: string, updates: Partial<InsertAiPrompt>): Promise<AiPrompt>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string) {
    const [u] = await db.select().from(users).where(eq(users.id, id));
    return u;
  }
  async upsertUser(userData: InsertUser) {
    const [u] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({ target: users.id, set: { ...userData } })
      .returning();
    return u;
  }

  async createForm(formData: InsertForm) {
    const [f] = await db.insert(forms).values(formData).returning();
    return f;
  }
  async getForm(id: string) {
    const [f] = await db.select().from(forms).where(eq(forms.id, id));
    return f;
  }
  async getFormsByUser(userId: string) {
    return db.select().from(forms).where(eq(forms.createdBy, userId)).orderBy(desc(forms.createdAt));
  }
  async updateForm(id: string, updates: UpdateForm) {
    const [f] = await db.update(forms).set(updates).where(eq(forms.id, id)).returning();
    return f;
  }
  async deleteForm(id: string) {
    await db.delete(forms).where(eq(forms.id, id));
  }

  async createFormResponse(r: InsertFormResponse) {
    const [x] = await db.insert(formResponses).values(r).returning();
    return x;
  }
  async getFormResponses(formId: string) {
    return db.select().from(formResponses).where(eq(formResponses.formId, formId)).orderBy(desc(formResponses.submittedAt));
  }
  async getFormResponse(id: string) {
    const [r] = await db.select().from(formResponses).where(eq(formResponses.id, id));
    return r;
  }
  async updateFormResponseStatus(id: string, status: string, reviewedBy?: string) {
    const [r] = await db
      .update(formResponses)
      .set({ status, reviewedBy: reviewedBy || null, reviewedAt: new Date() })
      .where(eq(formResponses.id, id))
      .returning();
    return r;
  }
  async updateFormResponseAiEnhanced(id: string, aiEnhancedResponses: any) {
    const [r] = await db
      .update(formResponses)
      .set({ aiEnhancedResponses })
      .where(eq(formResponses.id, id))
      .returning();
    return r;
  }

  async createAiPrompt(promptData: InsertAiPrompt) {
    const [p] = await db.insert(aiPrompts).values(promptData).returning();
    return p;
  }
  async getAiPrompt(questionId: string, formId: string) {
    const [p] = await db
      .select()
      .from(aiPrompts)
      .where(and(eq(aiPrompts.questionId, questionId), eq(aiPrompts.formId, formId)));
    return p;
  }
  async updateAiPrompt(questionId: string, formId: string, updates: Partial<InsertAiPrompt>) {
    const [p] = await db
      .update(aiPrompts)
      .set(updates)
      .where(and(eq(aiPrompts.questionId, questionId), eq(aiPrompts.formId, formId)))
      .returning();
    return p;
  }
}

export const storage = new DatabaseStorage();