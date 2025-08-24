import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { FloatingOrbs } from "@/components/ui/floating-orbs";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import type { Form } from "@shared/schema";

export default function FormFill() {
  const { id } = useParams();
  const { toast } = useToast();
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

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

  // Submit form response
  const submitResponseMutation = useMutation({
    mutationFn: async (responseData: any) => {
      const response = await apiRequest("POST", `/api/forms/${id}/responses`, responseData);
      return response.json();
    },
    onSuccess: () => {
      setIsSubmitted(true);
      toast({
        title: "Success",
        description: "Form submitted successfully! Your responses can now be enhanced with AI.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to submit form. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleInputChange = (questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = () => {
    submitResponseMutation.mutate({
      responses,
      submittedBy: "test-user",
      status: "pending",
    });
  };

  if (isLoadingForm) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading w-8 h-8"></div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <GlassCard className="p-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Form Not Found</h1>
          <p className="text-gray-300">The form you're looking for doesn't exist.</p>
        </GlassCard>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen relative">
        <FloatingOrbs />
        <div className="container mx-auto px-6 py-8 flex items-center justify-center min-h-screen">
          <GlassCard className="p-8 text-center max-w-md">
            <div className="text-6xl mb-6">🎉</div>
            <h1 className="text-2xl font-bold text-white mb-4">Thank You!</h1>
            <p className="text-gray-300 mb-6">Your form has been submitted successfully.</p>
            <p className="text-sm text-purple-300">
              Your responses can now be enhanced with AI on the admin side.
            </p>
            <Button
              onClick={() => window.location.href = `/form-responses/${id}`}
              className="mt-4 bg-gradient-to-r from-purple-500 to-blue-500"
            >
              View Responses (Admin)
            </Button>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <FloatingOrbs />
      
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Form Header */}
          <GlassCard className="p-8 mb-8 text-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-pink-400 bg-clip-text text-transparent mb-4">
              {form.title || "Untitled Form"}
            </h1>
            {form.description && (
              <p className="text-gray-300 text-lg">{form.description}</p>
            )}
          </GlassCard>

          {/* Questions */}
          <div className="space-y-6">
            {form.questions && Array.isArray(form.questions) && form.questions.map((question: any, index: number) => (
              <GlassCard key={question.id} className="p-6">
                <div className="mb-4">
                  <label className="block text-lg font-medium text-white mb-2">
                    {index + 1}. {question.title}
                    {question.required && <span className="text-red-400 ml-1">*</span>}
                  </label>

                  {question.type === 'short-text' && (
                    <Input
                      value={responses[question.id] || ''}
                      onChange={(e) => handleInputChange(question.id, e.target.value)}
                      className="w-full bg-white/10 text-white border border-purple-500/30 rounded-lg px-4 py-3"
                      placeholder="Type your answer..."
                      data-testid={`question-${question.id}`}
                    />
                  )}

                  {question.type === 'long-text' && (
                    <div>
                      <Textarea
                        value={responses[question.id] || ''}
                        onChange={(e) => handleInputChange(question.id, e.target.value)}
                        className="w-full bg-white/10 text-white border border-purple-500/30 rounded-lg px-4 py-3 h-32 resize-none"
                        placeholder="Type your detailed answer..."
                        data-testid={`question-${question.id}`}
                      />
                      <p className="text-sm text-purple-300 mt-2">
                        💡 This answer can be enhanced with AI after submission
                      </p>
                    </div>
                  )}

                  {question.type === 'multiple-choice' && question.options && (
                    <div className="space-y-2">
                      {question.options.map((option: string, optionIndex: number) => (
                        <label key={optionIndex} className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name={question.id}
                            value={option}
                            checked={responses[question.id] === option}
                            onChange={(e) => handleInputChange(question.id, e.target.value)}
                            className="text-purple-500"
                            data-testid={`option-${question.id}-${optionIndex}`}
                          />
                          <span className="text-white">{option}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {question.type === 'checkboxes' && question.options && (
                    <div className="space-y-2">
                      {question.options.map((option: string, optionIndex: number) => (
                        <label key={optionIndex} className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            value={option}
                            checked={(responses[question.id] || []).includes(option)}
                            onChange={(e) => {
                              const currentValues = responses[question.id] || [];
                              const newValues = e.target.checked
                                ? [...currentValues, option]
                                : currentValues.filter((v: string) => v !== option);
                              handleInputChange(question.id, newValues);
                            }}
                            className="text-purple-500"
                            data-testid={`checkbox-${question.id}-${optionIndex}`}
                          />
                          <span className="text-white">{option}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </GlassCard>
            ))}

            {/* Submit Button */}
            <div className="text-center pt-6">
              <Button
                onClick={handleSubmit}
                disabled={submitResponseMutation.isPending}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 px-8 py-3 text-lg font-medium"
                data-testid="submit-form-button"
              >
                {submitResponseMutation.isPending ? (
                  <>
                    <div className="loading w-5 h-5 mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane mr-2"></i>
                    Submit Form
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}