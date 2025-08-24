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
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: InsertUser): Promise<User>;
  
  // Form operations
  createForm(form: InsertForm): Promise<Form>;
  getForm(id: string): Promise<Form | undefined>;
  getFormsByUser(userId: string): Promise<Form[]>;
  updateForm(id: string, updates: UpdateForm): Promise<Form>;
  deleteForm(id: string): Promise<void>;
  
  // Form response operations
  createFormResponse(response: InsertFormResponse): Promise<FormResponse>;
  getFormResponses(formId: string): Promise<FormResponse[]>;
  getFormResponse(id: string): Promise<FormResponse | undefined>;
  updateFormResponseStatus(id: string, status: string, reviewedBy?: string): Promise<FormResponse>;
  updateFormResponseAiEnhanced(id: string, aiEnhancedResponses: any): Promise<FormResponse>;
  
  // AI prompt operations
  createAiPrompt(prompt: InsertAiPrompt): Promise<AiPrompt>;
  getAiPrompt(questionId: string, formId: string): Promise<AiPrompt | undefined>;
  updateAiPrompt(questionId: string, formId: string, updates: Partial<InsertAiPrompt>): Promise<AiPrompt>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Form operations
  async createForm(formData: InsertForm): Promise<Form> {
    const [form] = await db.insert(forms).values(formData).returning();
    return form;
  }

  async getForm(id: string): Promise<Form | undefined> {
    const [form] = await db.select().from(forms).where(eq(forms.id, id));
    return form;
  }

  async getFormsByUser(userId: string): Promise<Form[]> {
    return db
      .select()
      .from(forms)
      .where(eq(forms.createdBy, userId))
      .orderBy(desc(forms.createdAt));
  }

  async updateForm(id: string, updates: UpdateForm): Promise<Form> {
    const [form] = await db
      .update(forms)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(forms.id, id))
      .returning();
    return form;
  }

  async deleteForm(id: string): Promise<void> {
    await db.delete(forms).where(eq(forms.id, id));
  }

  // Form response operations
  async createFormResponse(responseData: InsertFormResponse): Promise<FormResponse> {
    const [response] = await db.insert(formResponses).values(responseData).returning();
    return response;
  }

  async getFormResponses(formId: string): Promise<FormResponse[]> {
    return db
      .select()
      .from(formResponses)
      .where(eq(formResponses.formId, formId))
      .orderBy(desc(formResponses.submittedAt));
  }

  async getFormResponse(id: string): Promise<FormResponse | undefined> {
    const [response] = await db.select().from(formResponses).where(eq(formResponses.id, id));
    return response;
  }

  async updateFormResponseStatus(id: string, status: string, reviewedBy?: string): Promise<FormResponse> {
    const [response] = await db
      .update(formResponses)
      .set({
        status,
        reviewedBy,
        reviewedAt: new Date(),
      })
      .where(eq(formResponses.id, id))
      .returning();
    return response;
  }

  async updateFormResponseAiEnhanced(id: string, aiEnhancedResponses: any): Promise<FormResponse> {
    const [response] = await db
      .update(formResponses)
      .set({ aiEnhancedResponses })
      .where(eq(formResponses.id, id))
      .returning();
    return response;
  }

  // AI prompt operations
  async createAiPrompt(promptData: InsertAiPrompt): Promise<AiPrompt> {
    const [prompt] = await db.insert(aiPrompts).values(promptData).returning();
    return prompt;
  }

  async getAiPrompt(questionId: string, formId: string): Promise<AiPrompt | undefined> {
    const [prompt] = await db
      .select()
      .from(aiPrompts)
      .where(eq(aiPrompts.questionId, questionId) && eq(aiPrompts.formId, formId));
    return prompt;
  }

  async updateAiPrompt(questionId: string, formId: string, updates: Partial<InsertAiPrompt>): Promise<AiPrompt> {
    const [prompt] = await db
      .update(aiPrompts)
      .set(updates)
      .where(eq(aiPrompts.questionId, questionId) && eq(aiPrompts.formId, formId))
      .returning();
    return prompt;
  }
}

export const storage = new DatabaseStorage();
