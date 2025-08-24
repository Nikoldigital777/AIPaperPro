import type { Express, Request, Response } from "express";
import express from "express";
import { storage } from "./storage";
import { insertFormSchema, updateFormSchema, insertFormResponseSchema } from "@shared/schema";
import { z } from "zod";
import { enhanceText, generateSuggestions, type EnhanceTextOptions } from "./services/anthropic";
import { sendEmail } from "./services/notify";
import http from "http";

const CreateFormBody = insertFormSchema.strict();
const UpdateFormBody = updateFormSchema.strict();
const CreateResponseBody = insertFormResponseSchema.strict();

const EnhanceBody = z.object({
  text: z.string().min(1),
  tone: z.enum(["professional", "casual", "formal", "creative"]).default("professional"),
  length: z.enum(["concise", "moderate", "detailed"]).default("moderate"),
  prompt: z.string().optional(),
});

export async function registerRoutes(app: Express) {
  const server = http.createServer(app);
  const api = express.Router();

  // Health
  api.get("/health", (_req, res) => res.json({ ok: true }));

  // Forms CRUD
  api.post("/forms", async (req, res, next) => {
    try {
      const body = CreateFormBody.parse(req.body);
      const created = await storage.createForm(body);
      res.json(created);
    } catch (e) { next(e); }
  });

  api.get("/forms", async (req, res, next) => {
    try {
      const userId = String(req.query.userId || "");
      if (!userId) return res.status(400).json({ message: "userId required" });
      const list = await storage.getFormsByUser(userId);
      res.json(list);
    } catch (e) { next(e); }
  });

  api.get("/forms/:id", async (req, res, next) => {
    try {
      const form = await storage.getForm(req.params.id);
      if (!form) return res.status(404).json({ message: "Form not found" });
      res.json(form);
    } catch (e) { next(e); }
  });

  api.patch("/forms/:id", async (req, res, next) => {
    try {
      const updates = UpdateFormBody.parse(req.body);
      const updated = await storage.updateForm(req.params.id, updates);
      res.json(updated);
    } catch (e) { next(e); }
  });

  api.delete("/forms/:id", async (req, res, next) => {
    try { 
      await storage.deleteForm(req.params.id); 
      res.json({ message: "Form deleted successfully" }); 
    } catch (e) { next(e); }
  });

  // AI endpoints
  api.post("/ai/enhance", async (req, res, next) => {
    try {
      const body = EnhanceBody.parse(req.body);
      const enhancedText = await enhanceText(body.text, {
        tone: body.tone,
        length: body.length,
        customPrompt: body.prompt,
      });
      res.json({ enhancedText });
    } catch (e) { next(e); }
  });

  api.post("/ai/suggest", async (req, res, next) => {
    try {
      const { text, context } = z.object({ text: z.string(), context: z.string().optional() }).parse(req.body);
      const suggestions = await generateSuggestions(text, context);
      res.json({ suggestions });
    } catch (e) { next(e); }
  });

  // Responses + workflow
  api.post("/forms/:id/responses", async (req, res, next) => {
    try {
      const form = await storage.getForm(req.params.id);
      if (!form) return res.status(404).json({ message: "Form not found" });

      const body = CreateResponseBody.parse({ ...req.body, formId: form.id });
      const saved = await storage.createFormResponse(body);

      // Run simple workflow: notify + optional approval gate
      const wf = (form.workflowConfig || {}) as any;
      const notify = Array.isArray(wf.notifyEmails) ? wf.notifyEmails : [];
      const approvalsRequired = Boolean(wf.requireApproval);

      if (notify.length && process.env.SENDGRID_API_KEY) {
        await sendEmail({
          to: notify,
          subject: `New submission for: ${form.title}`,
          html: `<p>A new submission was received.</p>
                 <p><b>Form:</b> ${form.title}</p>
                 <p><b>Respondent:</b> ${body.submittedBy || ""}</p>
                 <p><a href="${process.env.APP_BASE_URL || ""}/form-responses/${form.id}">Review responses</a></p>`
        });
      }

      // If approvals required, leave status as "submitted", otherwise mark approved
      if (!approvalsRequired) {
        await storage.updateFormResponseStatus(saved.id, "approved");
      }

      res.json(saved);
    } catch (e) { next(e); }
  });

  api.get("/forms/:id/responses", async (req, res, next) => {
    try { 
      res.json(await storage.getFormResponses(req.params.id)); 
    } catch (e) { next(e); }
  });

  api.patch("/responses/:id/status", async (req, res, next) => {
    try {
      const { status, reviewedBy } = req.body;
      const response = await storage.updateFormResponseStatus(req.params.id, status, reviewedBy);
      res.json(response);
    } catch (e) { next(e); }
  });

  api.post("/responses/:id/enhance", async (req, res, next) => {
    try {
      const schema = z.object({
        questionId: z.string(),
        originalText: z.string(),
        options: z.object({
          tone: z.enum(['professional', 'casual', 'formal', 'creative']),
          length: z.enum(['concise', 'moderate', 'detailed']),
          customPrompt: z.string().optional(),
        }),
      });

      const { questionId, originalText, options } = schema.parse(req.body);
      const enhancedText = await enhanceText(originalText, options);
      
      // Get current response
      const response = await storage.getFormResponse(req.params.id);
      if (!response) {
        return res.status(404).json({ message: "Response not found" });
      }

      // Update AI enhanced responses
      const aiEnhanced = (response.aiEnhancedResponses as Record<string, any>) || {};
      aiEnhanced[questionId] = enhancedText;
      
      const updatedResponse = await storage.updateFormResponseAiEnhanced(req.params.id, aiEnhanced);
      
      res.json({ enhancedText, response: updatedResponse });
    } catch (e) { next(e); }
  });

  app.use("/api", api);
  return server;
}