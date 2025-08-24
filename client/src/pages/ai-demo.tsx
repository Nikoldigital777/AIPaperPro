import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { FloatingOrbs } from "@/components/ui/floating-orbs";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function AiDemo() {
  const [originalText, setOriginalText] = useState("I think this project is okay but needs work");
  const [enhancedText, setEnhancedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const enhanceTextMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/ai/enhance', {
        text: originalText,
        tone: 'professional',
        length: 'moderate'
      });
      return response.json();
    },
    onSuccess: (data) => {
      setEnhancedText(data.enhancedText);
      setIsLoading(false);
    },
    onError: (error) => {
      console.error('Enhancement failed:', error);
      setIsLoading(false);
    },
  });

  const handleEnhance = () => {
    setIsLoading(true);
    enhanceTextMutation.mutate();
  };

  return (
    <div className="min-h-screen relative">
      <FloatingOrbs />
      
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-4">
              AI Enhancement Demo
            </h1>
            <p className="text-gray-400">See how Claude AI improves your text responses</p>
          </div>

          <GlassCard className="p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-4">Original Text</h2>
            <textarea
              value={originalText}
              onChange={(e) => setOriginalText(e.target.value)}
              className="w-full bg-white/10 text-white border border-purple-500/30 rounded-lg px-4 py-3 h-32 resize-none focus:border-purple-400 focus:outline-none"
              placeholder="Type some text here to enhance..."
            />
            <Button
              onClick={handleEnhance}
              disabled={isLoading || !originalText.trim()}
              className="mt-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Enhancing...
                </>
              ) : (
                <>
                  <i className="fas fa-robot mr-2"></i>
                  Enhance with AI
                </>
              )}
            </Button>
          </GlassCard>

          {enhancedText && (
            <GlassCard className="p-6 border-2 border-purple-500/30">
              <div className="flex items-center mb-4">
                <i className="fas fa-robot text-purple-400 mr-2"></i>
                <h2 className="text-xl font-semibold text-white">AI Enhanced Version</h2>
              </div>
              <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-lg p-4 border border-purple-500/20">
                <p className="text-white leading-relaxed">{enhancedText}</p>
              </div>
            </GlassCard>
          )}

          <div className="mt-8 text-center">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <h3 className="text-lg font-medium text-blue-400 mb-2">💡 How AI Works in Your Forms</h3>
              <p className="text-gray-300 text-sm">
                In real forms, users fill out long-text questions and can click "Enhance with AI" 
                to get professional, improved versions of their responses using Claude Sonnet 4.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}