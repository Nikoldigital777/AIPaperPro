import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { FloatingOrbs } from "@/components/ui/floating-orbs";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import type { Form } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Mock user ID - in real app this would come from auth
  const userId = "mock-user-id";

  const { data: forms = [], isLoading } = useQuery({
    queryKey: ["/api/forms", { userId }],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/forms?userId=${userId}`);
      return response.json();
    },
  });

  const createFormMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/forms", {
        title: "Untitled Form",
        description: "",
        createdBy: userId,
        questions: [],
        workflowConfig: {},
      });
      return response.json();
    },
    onSuccess: (newForm) => {
      queryClient.invalidateQueries({ queryKey: ["/api/forms"] });
      toast({
        title: "Success",
        description: "New form created successfully!",
      });
      // Navigate to form builder
      window.location.href = `/form-builder/${newForm.id}`;
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create form. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteFormMutation = useMutation({
    mutationFn: async (formId: string) => {
      await apiRequest("DELETE", `/api/forms/${formId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forms"] });
      toast({
        title: "Success",
        description: "Form deleted successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete form. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (form: Form) => {
    if (!form.isPublished) {
      return <span className="px-2 py-1 bg-yellow-500 bg-opacity-20 text-yellow-400 text-xs rounded-full">Draft</span>;
    }
    return <span className="px-2 py-1 bg-green-500 bg-opacity-20 text-green-400 text-xs rounded-full">Published</span>;
  };

  return (
    <div className="min-h-screen relative">
      <FloatingOrbs />
      
      <div className="container mx-auto px-6 py-8">
        {/* Hero Header */}
        <GlassCard className="p-12 mb-8 text-center relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-5xl font-black bg-gradient-to-r from-purple-400 via-blue-400 to-pink-400 bg-clip-text text-transparent mb-4 animate-pulse">
              AI Report Writing Module
            </h1>
            <p className="text-xl text-gray-300 mb-8">
              Create intelligent forms with AI-powered enhancements
            </p>
            <Button 
              onClick={() => createFormMutation.mutate()}
              disabled={createFormMutation.isPending}
              className="btn-primary px-8 py-4 text-lg font-semibold rounded-xl"
              data-testid="create-form-button"
            >
              {createFormMutation.isPending ? (
                <>
                  <div className="loading w-5 h-5 mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <i className="fas fa-plus mr-2"></i>
                  Create New Form
                </>
              )}
            </Button>
          </div>
        </GlassCard>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <GlassCard className="p-6 text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">{forms.length}</div>
            <div className="text-sm text-gray-400">Total Forms</div>
          </GlassCard>
          
          <GlassCard className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">
              {forms.filter((f: Form) => f.isPublished).length}
            </div>
            <div className="text-sm text-gray-400">Published</div>
          </GlassCard>
          
          <GlassCard className="p-6 text-center">
            <div className="text-3xl font-bold text-pink-400 mb-2">
              {forms.reduce((acc: number, f: Form) => acc + (Array.isArray(f.questions) ? f.questions.length : 0), 0)}
            </div>
            <div className="text-sm text-gray-400">Total Questions</div>
          </GlassCard>
          
          <GlassCard className="p-6 text-center">
            <div className="text-3xl font-bold text-green-400 mb-2 flex items-center justify-center">
              <i className="fas fa-robot mr-2"></i>
              AI
            </div>
            <div className="text-sm text-gray-400">Enhanced</div>
          </GlassCard>
        </div>

        {/* Forms Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Your Forms
            </h2>
            <Button
              onClick={() => createFormMutation.mutate()}
              disabled={createFormMutation.isPending}
              className="btn-primary"
              data-testid="create-form-header-button"
            >
              <i className="fas fa-plus mr-2"></i>New Form
            </Button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <GlassCard key={i} className="p-6 animate-pulse">
                  <div className="h-6 bg-gray-600 rounded mb-4"></div>
                  <div className="h-4 bg-gray-600 rounded mb-2"></div>
                  <div className="h-4 bg-gray-600 rounded w-2/3"></div>
                </GlassCard>
              ))}
            </div>
          ) : forms.length === 0 ? (
            <GlassCard className="p-12 text-center">
              <div className="text-gray-400 mb-4">
                <i className="fas fa-clipboard-list text-6xl mb-4 opacity-50"></i>
                <h3 className="text-xl font-medium mb-2">No forms yet</h3>
                <p className="text-sm">Create your first AI-enhanced form to get started</p>
              </div>
              <Button 
                onClick={() => createFormMutation.mutate()}
                disabled={createFormMutation.isPending}
                className="btn-primary mt-4"
                data-testid="create-first-form-button"
              >
                <i className="fas fa-plus mr-2"></i>Create Your First Form
              </Button>
            </GlassCard>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {forms.map((form: Form) => (
                <GlassCard key={form.id} className="p-6 relative group" data-testid={`form-card-${form.id}`}>
                  <div className="absolute top-4 right-4">
                    {getStatusBadge(form)}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-white mb-2 pr-20">
                    {form.title || 'Untitled Form'}
                  </h3>
                  
                  {form.description && (
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {form.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                    <span>Questions: {Array.isArray(form.questions) ? form.questions.length : 0}</span>
                    <span>
                      {form.createdAt && new Date(form.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Link href={`/form-builder/${form.id}`}>
                      <Button 
                        className="btn-primary flex-1"
                        data-testid={`edit-form-${form.id}`}
                      >
                        <i className="fas fa-edit mr-2"></i>Edit
                      </Button>
                    </Link>
                    
                    <Link href={`/form-responses/${form.id}`}>
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        data-testid={`view-responses-${form.id}`}
                      >
                        <i className="fas fa-chart-line mr-2"></i>Responses
                      </Button>
                    </Link>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        if (confirm('Are you sure you want to delete this form?')) {
                          deleteFormMutation.mutate(form.id);
                        }
                      }}
                      className="text-red-400 hover:text-red-300"
                      data-testid={`delete-form-${form.id}`}
                    >
                      <i className="fas fa-trash"></i>
                    </Button>
                  </div>
                </GlassCard>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
