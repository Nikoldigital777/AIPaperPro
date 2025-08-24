import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useFormBuilder } from "@/hooks/use-form-builder";
import { FloatingOrbs } from "@/components/ui/floating-orbs";
import { Sidebar } from "@/components/form-builder/sidebar";
import { DropZone } from "@/components/form-builder/drop-zone";
import { QuestionItem } from "@/components/form-builder/question-item";
import { PreviewModal } from "@/components/modals/preview-modal";
import { AIPromptModal, type AIPromptConfig } from "@/components/modals/ai-prompt-modal";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { QuestionType } from "@/lib/types";
import type { Form } from "@shared/schema";
import { exportFormToPDF, exportFormToDocx } from "@/lib/export-utils";

export default function FormBuilder() {
  const { id } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isAIPromptOpen, setIsAIPromptOpen] = useState(false);
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);
  const [draggedType, setDraggedType] = useState<QuestionType | null>(null);

  const {
    formState,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    updateFormTitle,
    updateFormDescription,
    updateWorkflowConfig,
    loadFormData,
  } = useFormBuilder();

  // Load existing form if editing
  const { data: existingForm, isLoading: isLoadingForm } = useQuery({
    queryKey: ["/api/forms", id],
    queryFn: async () => {
      if (!id) return null;
      const response = await apiRequest("GET", `/api/forms/${id}`);
      return response.json();
    },
    enabled: !!id,
  });

  // Update form state when existing form loads
  useEffect(() => {
    if (existingForm) {
      loadFormData({
        title: existingForm.title || '',
        description: existingForm.description || '',
        questions: existingForm.questions || [],
        workflowConfig: {
          emailNotifications: existingForm.workflowConfig?.emailNotifications || false,
          slackNotifications: existingForm.workflowConfig?.slackNotifications || false,
          requireApproval: existingForm.workflowConfig?.requireApproval || false,
          approverEmail: existingForm.workflowConfig?.approverEmail || '',
        },
      });
    }
  }, [existingForm, loadFormData]);

  const saveFormMutation = useMutation({
    mutationFn: async (formData: any) => {
      if (id) {
        const response = await apiRequest("PATCH", `/api/forms/${id}`, formData);
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/forms", {
          ...formData,
          createdBy: "default-user", // In real app, get from auth
        });
        return response.json();
      }
    },
    onSuccess: (savedForm) => {
      queryClient.invalidateQueries({ queryKey: ["/api/forms"] });
      toast({
        title: "Success",
        description: "Form saved successfully!",
      });
      
      // If this was a new form, redirect to the edit URL
      if (!id && savedForm.id) {
        window.history.replaceState(null, '', `/form-builder/${savedForm.id}`);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to save form. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDragStart = (type: QuestionType) => {
    setDraggedType(type);
  };

  const handleDrop = (type: QuestionType) => {
    addQuestion(type);
    setDraggedType(null);
  };

  const handleSaveForm = () => {
    console.log('Save button clicked, form state:', formState);
    
    const formData = {
      title: formState.title || 'Untitled Form',
      description: formState.description || '',
      questions: formState.questions,
      workflowConfig: formState.workflowConfig,
    };
    
    console.log('Saving form data:', formData);
    saveFormMutation.mutate(formData);
  };

  const handleConfigureAI = (questionId: string) => {
    setCurrentQuestionId(questionId);
    setIsAIPromptOpen(true);
  };

  const handleSaveAIPrompt = (config: AIPromptConfig) => {
    if (currentQuestionId) {
      updateQuestion(currentQuestionId, {
        aiPrompt: config,
      });
    }
    setCurrentQuestionId(null);
  };

  const handleExportPDF = () => {
    try {
      exportFormToPDF(formState);
      toast({
        title: "Success",
        description: "Form exported to PDF successfully!",
      });
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to export PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportDocx = async () => {
    try {
      await exportFormToDocx(formState);
      toast({
        title: "Success",
        description: "Form exported to Word document successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export Word document. Please try again.",
        variant: "destructive", 
      });
    }
  };

  if (isLoadingForm) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading w-8 h-8"></div>
        <span className="ml-3 text-white">Loading form...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <FloatingOrbs />
      
      <div className="flex">
        <Sidebar
          onDragStart={handleDragStart}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <div className="flex-1 lg:ml-0">
          {/* Top Navigation */}
          <nav className="glass-card mx-6 mt-6 rounded-2xl p-4 sticky top-6 z-40">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  className="lg:hidden text-white hover:text-purple-400"
                  onClick={() => setIsSidebarOpen(true)}
                  data-testid="sidebar-toggle-button"
                >
                  <i className="fas fa-bars text-xl"></i>
                </Button>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-pink-400 bg-clip-text text-transparent">
                  AI Report Builder
                </h1>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  onClick={() => {
                    console.log('Preview button clicked');
                    setIsPreviewOpen(true);
                  }}
                  className="btn-primary px-4 py-2 rounded-xl font-medium"
                  data-testid="preview-button"
                >
                  <i className="fas fa-eye mr-2"></i>Preview
                </Button>
                <Button
                  onClick={handleExportPDF}
                  variant="outline"
                  className="px-4 py-2 rounded-xl font-medium"
                  data-testid="export-pdf-button"
                >
                  <i className="fas fa-file-pdf mr-2"></i>PDF
                </Button>
                <Button
                  onClick={handleExportDocx}
                  variant="outline"
                  className="px-4 py-2 rounded-xl font-medium"
                  data-testid="export-docx-button"
                >
                  <i className="fas fa-file-word mr-2"></i>Word
                </Button>
                <Button
                  onClick={handleSaveForm}
                  disabled={saveFormMutation.isPending}
                  className="btn-primary px-4 py-2 rounded-xl font-medium"
                  data-testid="save-button"
                >
                  {saveFormMutation.isPending ? (
                    <>
                      <div className="loading w-4 h-4 mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save mr-2"></i>Save
                    </>
                  )}
                </Button>
              </div>
            </div>
          </nav>

          {/* Form Builder Area */}
          <div className="p-6">
            {/* Form Header */}
            <GlassCard className="p-6 mb-6">
              <div className="mb-4">
                <Input
                  value={formState.title ?? ''}
                  onChange={(e) => updateFormTitle(e.target.value)}
                  placeholder="Untitled Form"
                  className="bg-transparent text-2xl font-bold text-white border-none outline-none w-full p-0"
                  data-testid="form-title-input"
                />
              </div>
              <div className="mb-4">
                <Textarea
                  value={formState.description ?? ''}
                  onChange={(e) => updateFormDescription(e.target.value)}
                  placeholder="Form description..."
                  className="bg-transparent text-gray-300 border-none outline-none w-full resize-none p-0"
                  rows={2}
                  data-testid="form-description-input"
                />
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span>Questions: <span data-testid="question-count">{formState.questions.length}</span></span>
                <span>•</span>
                <span>AI Enhanced: <span className="text-purple-400">Yes</span></span>
              </div>
            </GlassCard>

            {/* Drop Zone for Form Elements */}
            <div data-testid="form-builder-area">
              <DropZone
                onDrop={handleDrop}
                isEmpty={formState.questions.length === 0}
              >
                {formState.questions.map((question) => (
                  <QuestionItem
                    key={question.id}
                    question={question}
                    onUpdate={updateQuestion}
                    onDelete={deleteQuestion}
                    onConfigureAI={handleConfigureAI}
                  />
                ))}
              </DropZone>
            </div>

            {/* Workflow Configuration */}
            <GlassCard className="p-6 mt-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <i className="fas fa-cogs text-purple-400 mr-3"></i>
                Workflow Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-300">Notifications</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formState.workflowConfig.emailNotifications}
                        onChange={(e) => updateWorkflowConfig({ emailNotifications: e.target.checked })}
                        className="mr-2 rounded"
                        data-testid="email-notifications-checkbox"
                      />
                      <span className="text-sm text-gray-300">Email notifications</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formState.workflowConfig.slackNotifications}
                        onChange={(e) => updateWorkflowConfig({ slackNotifications: e.target.checked })}
                        className="mr-2 rounded"
                        data-testid="slack-notifications-checkbox"
                      />
                      <span className="text-sm text-gray-300">Slack notifications</span>
                    </label>
                  </div>
                </div>
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-300">Approvals</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formState.workflowConfig.requireApproval}
                        onChange={(e) => updateWorkflowConfig({ requireApproval: e.target.checked })}
                        className="mr-2 rounded"
                        data-testid="require-approval-checkbox"
                      />
                      <span className="text-sm text-gray-300">Require approval</span>
                    </label>
                    <Input
                      type="email"
                      placeholder="Approver email"
                      value={formState.workflowConfig.approverEmail ?? ''}
                      onChange={(e) => updateWorkflowConfig({ approverEmail: e.target.value })}
                      className="w-full"
                      data-testid="approver-email-input"
                    />
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>

      {/* Modals */}
      <PreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={formState.title}
        description={formState.description}
        questions={formState.questions}
      />

      <AIPromptModal
        isOpen={isAIPromptOpen}
        onClose={() => setIsAIPromptOpen(false)}
        onSave={handleSaveAIPrompt}
        initialConfig={
          currentQuestionId
            ? formState.questions.find(q => q.id === currentQuestionId)?.aiPrompt
            : undefined
        }
      />
    </div>
  );
}
