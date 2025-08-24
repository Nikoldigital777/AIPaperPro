import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

interface AIPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (config: AIPromptConfig) => void;
  initialConfig?: AIPromptConfig;
}

export interface AIPromptConfig {
  prompt: string;
  tone: 'professional' | 'casual' | 'formal' | 'creative';
  length: 'concise' | 'moderate' | 'detailed';
}

export function AIPromptModal({ isOpen, onClose, onSave, initialConfig }: AIPromptModalProps) {
  const [config, setConfig] = useState<AIPromptConfig>(
    initialConfig || {
      prompt: '',
      tone: 'professional',
      length: 'moderate',
    }
  );

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  const handleCancel = () => {
    if (initialConfig) {
      setConfig(initialConfig);
    } else {
      setConfig({
        prompt: '',
        tone: 'professional',
        length: 'moderate',
      });
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="glass-card max-w-2xl w-full"
        data-testid="ai-prompt-modal"
      >
        <DialogHeader className="border-b border-white border-opacity-20 pb-4">
          <DialogTitle className="text-xl font-bold text-white flex items-center">
            <i className="fas fa-robot text-purple-400 mr-3"></i>
            AI Prompt Configuration
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              AI Prompt Instructions
            </label>
            <Textarea
              value={config.prompt}
              onChange={(e) => setConfig(prev => ({ ...prev, prompt: e.target.value }))}
              className="w-full h-32 resize-none"
              placeholder="Enter instructions for AI to enhance responses..."
              data-testid="ai-prompt-textarea"
            />
            <p className="text-xs text-gray-400 mt-2">
              This prompt will guide how AI enhances user responses for this question.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tone
              </label>
              <Select
                value={config.tone}
                onValueChange={(value: any) => setConfig(prev => ({ ...prev, tone: value }))}
              >
                <SelectTrigger data-testid="tone-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="creative">Creative</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Length
              </label>
              <Select
                value={config.length}
                onValueChange={(value: any) => setConfig(prev => ({ ...prev, length: value }))}
              >
                <SelectTrigger data-testid="length-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="concise">Concise</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="detailed">Detailed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <Button
              variant="outline"
              onClick={handleCancel}
              data-testid="ai-prompt-cancel-button"
            >
              Cancel
            </Button>
            <Button
              className="btn-primary"
              onClick={handleSave}
              data-testid="ai-prompt-save-button"
            >
              Save Prompt
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
