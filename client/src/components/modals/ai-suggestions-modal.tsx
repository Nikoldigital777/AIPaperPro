import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AISuggestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalText: string;
  onAccept: (enhancedText: string) => void;
  questionId?: string;
  responseId?: string;
}

export function AISuggestionsModal({ 
  isOpen, 
  onClose, 
  originalText, 
  onAccept,
  questionId,
  responseId 
}: AISuggestionsModalProps) {
  const [enhancedText, setEnhancedText] = useState<string>('');
  const { toast } = useToast();

  const enhanceTextMutation = useMutation({
    mutationFn: async ({ text, options }: any) => {
      const response = await apiRequest('POST', '/api/ai/enhance', { text, ...options });
      return response.json();
    },
    onSuccess: (data) => {
      setEnhancedText(data.enhancedText);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to enhance text. Please try again.",
        variant: "destructive",
      });
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/ai/suggestions', {
        text: originalText,
        context: 'Form response enhancement',
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.suggestions && data.suggestions.length > 0) {
        setEnhancedText(data.suggestions[0]);
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to regenerate suggestion. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Generate initial enhancement when modal opens
  useEffect(() => {
    if (isOpen && originalText && !enhancedText) {
      enhanceTextMutation.mutate({
        text: originalText,
        options: {
          tone: 'professional',
          length: 'moderate',
        },
      });
    }
  }, [isOpen, originalText]);

  const handleAccept = () => {
    onAccept(enhancedText);
    onClose();
  };

  const handleRegenerate = () => {
    regenerateMutation.mutate();
  };

  const handleKeepOriginal = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="glass-card max-w-5xl w-full max-h-screen overflow-hidden"
        data-testid="ai-suggestions-modal"
      >
        <DialogHeader className="border-b border-white border-opacity-20 pb-4">
          <DialogTitle className="text-xl font-bold text-white flex items-center">
            <i className="fas fa-robot text-purple-400 mr-3"></i>
            AI Text Suggestions
          </DialogTitle>
        </DialogHeader>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Original Text */}
            <div>
              <h3 className="text-lg font-medium text-white mb-3">Original Response</h3>
              <ScrollArea className="bg-white bg-opacity-5 rounded-lg p-4 h-48">
                <p className="text-gray-300" data-testid="original-text">
                  {originalText}
                </p>
              </ScrollArea>
            </div>
            
            {/* AI Enhanced Text */}
            <div>
              <h3 className="text-lg font-medium text-white mb-3 flex items-center">
                AI Enhanced Version
                <i className="fas fa-sparkles text-purple-400 ml-2"></i>
              </h3>
              <ScrollArea className="bg-gradient-to-br from-purple-500 from-opacity-10 to-blue-500 to-opacity-10 rounded-lg p-4 h-48 border border-purple-500 border-opacity-30">
                {enhanceTextMutation.isPending ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="loading"></div>
                    <span className="ml-2 text-gray-300">Enhancing text...</span>
                  </div>
                ) : (
                  <p className="text-white" data-testid="enhanced-text">
                    {enhancedText}
                  </p>
                )}
              </ScrollArea>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4 mt-6">
            <Button
              onClick={handleAccept}
              className="btn-primary px-6 py-3 rounded-lg"
              disabled={!enhancedText || enhanceTextMutation.isPending}
              data-testid="accept-suggestion-button"
            >
              <i className="fas fa-check mr-2"></i>Accept AI Version
            </Button>
            
            <Button
              onClick={handleRegenerate}
              variant="outline"
              className="px-6 py-3 rounded-lg"
              disabled={regenerateMutation.isPending}
              data-testid="regenerate-button"
            >
              {regenerateMutation.isPending ? (
                <div className="loading w-4 h-4 mr-2"></div>
              ) : (
                <i className="fas fa-sync-alt mr-2"></i>
              )}
              Regenerate
            </Button>
            
            <Button
              onClick={handleKeepOriginal}
              variant="outline"
              className="px-6 py-3 rounded-lg"
              data-testid="keep-original-button"
            >
              <i className="fas fa-times mr-2"></i>Keep Original
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
