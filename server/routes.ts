import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { enhanceText, generateSuggestions, type EnhanceTextOptions } from "./services/anthropic";
import { 
  insertFormSchema, 
  updateFormSchema, 
  insertFormResponseSchema,
  insertAiPromptSchema 
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Forms routes
  app.post("/api/forms", async (req, res) => {
    try {
      const formData = insertFormSchema.parse(req.body);
      const form = await storage.createForm(formData);
      res.json(form);
    } catch (error) {
      console.error("Error creating form:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get("/api/forms", async (req, res) => {
    try {
      const { userId } = req.query;
      if (!userId) {
        return res.status(400).json({ message: "userId is required" });
      }
      const forms = await storage.getFormsByUser(userId as string);
      res.json(forms);
    } catch (error) {
      console.error("Error fetching forms:", error);
      res.status(500).json({ message: "Failed to fetch forms" });
    }
  });

  app.get("/api/forms/:id", async (req, res) => {
    try {
      const form = await storage.getForm(req.params.id);
      if (!form) {
        return res.status(404).json({ message: "Form not found" });
      }
      res.json(form);
    } catch (error) {
      console.error("Error fetching form:", error);
      res.status(500).json({ message: "Failed to fetch form" });
    }
  });

  app.patch("/api/forms/:id", async (req, res) => {
    try {
      const updates = updateFormSchema.parse(req.body);
      const form = await storage.updateForm(req.params.id, updates);
      res.json(form);
    } catch (error) {
      console.error("Error updating form:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.delete("/api/forms/:id", async (req, res) => {
    try {
      await storage.deleteForm(req.params.id);
      res.json({ message: "Form deleted successfully" });
    } catch (error) {
      console.error("Error deleting form:", error);
      res.status(500).json({ message: "Failed to delete form" });
    }
  });

  // Form responses routes
  app.post("/api/forms/:id/responses", async (req, res) => {
    try {
      const responseData = insertFormResponseSchema.parse({
        ...req.body,
        formId: req.params.id,
      });
      const response = await storage.createFormResponse(responseData);
      res.json(response);
    } catch (error) {
      console.error("Error creating response:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get("/api/forms/:id/responses", async (req, res) => {
    try {
      const responses = await storage.getFormResponses(req.params.id);
      res.json(responses);
    } catch (error) {
      console.error("Error fetching responses:", error);
      res.status(500).json({ message: "Failed to fetch responses" });
    }
  });

  app.patch("/api/responses/:id/status", async (req, res) => {
    try {
      const { status, reviewedBy } = req.body;
      const response = await storage.updateFormResponseStatus(req.params.id, status, reviewedBy);
      res.json(response);
    } catch (error) {
      console.error("Error updating response status:", error);
      res.status(500).json({ message: "Failed to update response status" });
    }
  });

  // AI enhancement routes
  app.post("/api/ai/enhance", async (req, res) => {
    try {
      const schema = z.object({
        text: z.string().min(1),
        tone: z.enum(['professional', 'casual', 'formal', 'creative']).default('professional'),
        length: z.enum(['concise', 'moderate', 'detailed']).default('moderate'),
        customPrompt: z.string().optional(),
      });

      const { text, tone, length, customPrompt } = schema.parse(req.body);
      
      const options: EnhanceTextOptions = { tone, length, customPrompt };
      const enhancedText = await enhanceText(text, options);
      
      res.json({ enhancedText });
    } catch (error) {
      console.error("Error enhancing text:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post("/api/ai/suggestions", async (req, res) => {
    try {
      const schema = z.object({
        text: z.string().min(1),
        context: z.string().optional(),
      });

      const { text, context } = schema.parse(req.body);
      const suggestions = await generateSuggestions(text, context);
      
      res.json({ suggestions });
    } catch (error) {
      console.error("Error generating suggestions:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post("/api/responses/:id/enhance", async (req, res) => {
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
    } catch (error) {
      console.error("Error enhancing response:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // AI prompts routes
  app.post("/api/ai/prompts", async (req, res) => {
    try {
      const promptData = insertAiPromptSchema.parse(req.body);
      const prompt = await storage.createAiPrompt(promptData);
      res.json(prompt);
    } catch (error) {
      console.error("Error creating AI prompt:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.get("/api/ai/prompts/:formId/:questionId", async (req, res) => {
    try {
      const { formId, questionId } = req.params;
      const prompt = await storage.getAiPrompt(questionId, formId);
      
      if (!prompt) {
        return res.status(404).json({ message: "AI prompt not found" });
      }
      
      res.json(prompt);
    } catch (error) {
      console.error("Error fetching AI prompt:", error);
      res.status(500).json({ message: "Failed to fetch AI prompt" });
    }
  });

  app.patch("/api/ai/prompts/:formId/:questionId", async (req, res) => {
    try {
      const { formId, questionId } = req.params;
      const updates = req.body;
      
      const prompt = await storage.updateAiPrompt(questionId, formId, updates);
      res.json(prompt);
    } catch (error) {
      console.error("Error updating AI prompt:", error);
      res.status(500).json({ message: "Failed to update AI prompt" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
