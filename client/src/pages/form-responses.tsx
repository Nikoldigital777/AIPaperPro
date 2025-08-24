import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { FloatingOrbs } from "@/components/ui/floating-orbs";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AISuggestionsModal } from "@/components/modals/ai-suggestions-modal";
import { useToast } from "@/hooks/use-toast";
import type { Form, FormResponse } from "@shared/schema";

interface ResponseWithForm extends FormResponse {
  form?: Form;
}

export default function FormResponses() {
  const { id } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedResponse, setSelectedResponse] = useState<FormResponse | null>(null);
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(null);
  const [originalText, setOriginalText] = useState<string>("");
  const [isAISuggestionsOpen, setIsAISuggestionsOpen] = useState(false);

  // Fetch form details
  const { data: form, isLoading: isLoadingForm } = useQuery({
    queryKey: ["/api/forms", id],
    queryFn: async () => {
      if (!id) throw new Error("Form ID is required");
      const response = await apiRequest("GET", `/api/forms/${id}`);
      return response.json();
    },
    enabled: !!id,
  });

  // Fetch form responses
  const { data: responses = [], isLoading: isLoadingResponses } = useQuery({
    queryKey: ["/api/forms", id, "responses"],
    queryFn: async () => {
      if (!id) throw new Error("Form ID is required");
      const response = await apiRequest("GET", `/api/forms/${id}/responses`);
      return response.json();
    },
    enabled: !!id,
  });

  // Update response status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ responseId, status, reviewedBy }: { responseId: string; status: string; reviewedBy?: string }) => {
      const response = await apiRequest("PATCH", `/api/responses/${responseId}/status`, {
        status,
        reviewedBy,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forms", id, "responses"] });
      toast({
        title: "Success",
        description: "Response status updated successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update response status. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Enhance response text mutation
  const enhanceResponseMutation = useMutation({
    mutationFn: async ({ 
      responseId, 
      questionId, 
      originalText, 
      options 
    }: { 
      responseId: string; 
      questionId: string; 
      originalText: string; 
      options: any;
    }) => {
      const response = await apiRequest("POST", `/api/responses/${responseId}/enhance`, {
        questionId,
        originalText,
        options,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forms", id, "responses"] });
      toast({
        title: "Success",
        description: "Response enhanced successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to enhance response. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleShowAISuggestions = (response: FormResponse, questionId: string, text: string) => {
    setSelectedResponse(response);
    setSelectedQuestionId(questionId);
    setOriginalText(text);
    setIsAISuggestionsOpen(true);
  };

  const handleAcceptSuggestion = (enhancedText: string) => {
    if (selectedResponse && selectedQuestionId) {
      enhanceResponseMutation.mutate({
        responseId: selectedResponse.id,
        questionId: selectedQuestionId,
        originalText,
        options: {
          tone: 'professional',
          length: 'moderate',
        },
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <span className="px-3 py-1 bg-yellow-500 bg-opacity-20 text-yellow-400 text-xs rounded-full uppercase font-semibold">Draft</span>;
      case 'approved':
        return <span className="px-3 py-1 bg-green-500 bg-opacity-20 text-green-400 text-xs rounded-full uppercase font-semibold">Approved</span>;
      case 'rejected':
        return <span className="px-3 py-1 bg-red-500 bg-opacity-20 text-red-400 text-xs rounded-full uppercase font-semibold">Rejected</span>;
      default:
        return <span className="px-3 py-1 bg-blue-500 bg-opacity-20 text-blue-400 text-xs rounded-full uppercase font-semibold">Review</span>;
    }
  };

  const exportToPDF = () => {
    toast({
      title: "Export Feature",
      description: "PDF export functionality will be implemented with a PDF generation library.",
    });
  };

  if (isLoadingForm || isLoadingResponses) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading w-8 h-8"></div>
        <span className="ml-3 text-white">Loading responses...</span>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <GlassCard className="p-8 text-center">
          <i className="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
          <h2 className="text-xl font-bold text-white mb-2">Form Not Found</h2>
          <p className="text-gray-400">The form you're looking for doesn't exist.</p>
        </GlassCard>
      </div>
    );
  }

  // Calculate analytics
  const totalResponses = responses.length;
  const aiEnhancedCount = responses.filter((r: FormResponse) => 
    r.aiEnhancedResponses && Object.keys(r.aiEnhancedResponses).length > 0
  ).length;
  const approvedCount = responses.filter((r: FormResponse) => r.status === 'approved').length;

  return (
    <div className="min-h-screen relative">
      <FloatingOrbs />
      
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Form Responses
            </h1>
            <p className="text-gray-400 mt-2">{form.title || 'Untitled Form'}</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={exportToPDF}
              className="btn-primary px-4 py-2 rounded-lg"
              data-testid="export-pdf-button"
            >
              <i className="fas fa-file-pdf mr-2"></i>Export PDF
            </Button>
            <Button
              onClick={() => window.history.back()}
              variant="outline"
              className="px-4 py-2 rounded-lg"
              data-testid="back-button"
            >
              <i className="fas fa-arrow-left mr-2"></i>Back
            </Button>
          </div>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <GlassCard className="p-6 text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2" data-testid="total-responses">
              {totalResponses}
            </div>
            <div className="text-sm text-gray-400">Total Responses</div>
          </GlassCard>
          
          <GlassCard className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2" data-testid="ai-enhanced-count">
              {aiEnhancedCount}
            </div>
            <div className="text-sm text-gray-400">AI Enhanced</div>
          </GlassCard>
          
          <GlassCard className="p-6 text-center">
            <div className="text-3xl font-bold text-green-400 mb-2" data-testid="approved-count">
              {approvedCount}
            </div>
            <div className="text-sm text-gray-400">Approved</div>
          </GlassCard>
          
          <GlassCard className="p-6 text-center">
            <div className="text-3xl font-bold text-pink-400 mb-2">
              {totalResponses > 0 ? `${Math.round((approvedCount / totalResponses) * 100)}%` : '0%'}
            </div>
            <div className="text-sm text-gray-400">Approval Rate</div>
          </GlassCard>
        </div>

        {/* Responses List */}
        <GlassCard className="p-6">
          <h2 className="text-xl font-bold text-white mb-6">Individual Responses</h2>
          
          {responses.length === 0 ? (
            <div className="text-center py-12">
              <i className="fas fa-inbox text-4xl text-gray-500 mb-4"></i>
              <h3 className="text-lg font-medium text-gray-400 mb-2">No responses yet</h3>
              <p className="text-gray-500">Responses will appear here once users submit the form.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {responses.map((response: FormResponse, index: number) => (
                <GlassCard key={response.id} className="p-6" data-testid={`response-${response.id}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        {response.respondentName ? response.respondentName.charAt(0).toUpperCase() : index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-white">
                          {response.respondentName || `Anonymous User ${index + 1}`}
                        </div>
                        <div className="text-xs text-gray-400">
                          Submitted {response.submittedAt ? new Date(response.submittedAt).toLocaleString() : 'Unknown'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {getStatusBadge(response.status)}
                      <div className="flex space-x-2">
                        {response.status === 'submitted' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => updateStatusMutation.mutate({ 
                                responseId: response.id, 
                                status: 'approved',
                                reviewedBy: 'mock-user-id'
                              })}
                              disabled={updateStatusMutation.isPending}
                              className="bg-green-600 hover:bg-green-700 text-white"
                              data-testid={`approve-response-${response.id}`}
                            >
                              <i className="fas fa-check mr-1"></i>Approve
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => updateStatusMutation.mutate({ 
                                responseId: response.id, 
                                status: 'rejected',
                                reviewedBy: 'mock-user-id'
                              })}
                              disabled={updateStatusMutation.isPending}
                              variant="outline"
                              className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                              data-testid={`reject-response-${response.id}`}
                            >
                              <i className="fas fa-times mr-1"></i>Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Response Content */}
                  <div className="space-y-4">
                    {form.questions && Array.isArray(form.questions) && form.questions.map((question: any, qIndex: number) => {
                      const responseValue = response.responses?.[question.id];
                      const aiEnhancedValue = response.aiEnhancedResponses?.[question.id];
                      
                      if (!responseValue) return null;

                      return (
                        <div key={question.id} className="border-l-4 border-purple-500 pl-4">
                          <div className="text-sm font-medium text-gray-300 mb-2">
                            {qIndex + 1}. {question.title}
                          </div>
                          
                          <div className="bg-white bg-opacity-5 rounded-lg p-3 mb-2">
                            <div className="text-white">{responseValue}</div>
                          </div>

                          {aiEnhancedValue && (
                            <div className="bg-gradient-to-br from-purple-500 from-opacity-10 to-blue-500 to-opacity-10 rounded-lg p-3 border border-purple-500 border-opacity-30 mb-2">
                              <div className="flex items-center mb-2">
                                <i className="fas fa-robot text-purple-400 mr-2"></i>
                                <span className="text-sm text-purple-400 font-medium">AI Enhanced Version</span>
                              </div>
                              <div className="text-white">{aiEnhancedValue}</div>
                            </div>
                          )}

                          {question.type === 'long-text' && !aiEnhancedValue && (
                            <Button
                              size="sm"
                              onClick={() => handleShowAISuggestions(response, question.id, responseValue)}
                              className="text-purple-400 hover:text-purple-300 p-0 h-auto font-normal"
                              variant="ghost"
                              data-testid={`enhance-text-${question.id}`}
                            >
                              <i className="fas fa-robot mr-1"></i>
                              Enhance with AI
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {/* AI Suggestions Modal */}
      <AISuggestionsModal
        isOpen={isAISuggestionsOpen}
        onClose={() => {
          setIsAISuggestionsOpen(false);
          setSelectedResponse(null);
          setSelectedQuestionId(null);
          setOriginalText("");
        }}
        originalText={originalText}
        onAccept={handleAcceptSuggestion}
        questionId={selectedQuestionId || undefined}
        responseId={selectedResponse?.id}
      />
    </div>
  );
}
