import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Question } from "@/lib/types";
import { GlassCard } from "@/components/ui/glass-card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  questions: Question[];
}

export function PreviewModal({ isOpen, onClose, title, description, questions }: PreviewModalProps) {
  const renderPreviewQuestion = (question: Question, index: number) => {
    const renderInput = () => {
      switch (question.type) {
        case 'multiple-choice':
          return (
            <div className="space-y-2">
              {question.options?.map((option, i) => (
                <label key={i} className="flex items-center space-x-3">
                  <input 
                    type="radio" 
                    name={`question_${question.id}`} 
                    className="text-purple-500"
                    data-testid={`preview-radio-${i}`}
                  />
                  <span className="text-gray-300">{option}</span>
                </label>
              ))}
            </div>
          );

        case 'checkboxes':
          return (
            <div className="space-y-2">
              {question.options?.map((option, i) => (
                <label key={i} className="flex items-center space-x-3">
                  <input 
                    type="checkbox" 
                    className="text-purple-500"
                    data-testid={`preview-checkbox-${i}`}
                  />
                  <span className="text-gray-300">{option}</span>
                </label>
              ))}
            </div>
          );

        case 'text-field':
          return (
            <Input
              className="w-full"
              placeholder="Your answer"
              data-testid="preview-text-input"
            />
          );

        case 'long-text':
          return (
            <div>
              <Textarea
                className="w-full h-24 resize-none"
                placeholder="Your detailed answer"
                data-testid="preview-textarea"
              />
              <div className="flex items-center mt-2 text-xs text-purple-400">
                <i className="fas fa-robot mr-1"></i>
                AI enhancement enabled
              </div>
            </div>
          );

        case 'number':
          return (
            <Input
              type="number"
              className="w-full"
              placeholder="Enter number"
              data-testid="preview-number-input"
            />
          );

        case 'date':
          return (
            <Input
              type="date"
              className="w-full"
              data-testid="preview-date-input"
            />
          );

        default:
          return null;
      }
    };

    return (
      <GlassCard key={question.id} className="p-6 mb-4">
        <h3 className="text-lg font-medium text-white mb-4">
          {index + 1}. {question.title}
          {question.required && <span className="text-red-400 ml-1">*</span>}
        </h3>
        {renderInput()}
      </GlassCard>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="glass-card max-w-4xl w-full max-h-screen overflow-hidden"
        data-testid="preview-modal"
      >
        <DialogHeader className="border-b border-white border-opacity-20 pb-4">
          <DialogTitle className="text-xl font-bold text-white">Form Preview</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[70vh] p-6">
          {questions.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <i className="fas fa-eye text-4xl mb-4 opacity-50"></i>
              <p>No questions added yet. Start building your form!</p>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {title || 'Untitled Form'}
                </h2>
                {description && (
                  <p className="text-gray-300">{description}</p>
                )}
              </div>

              {questions.map((question, index) => 
                renderPreviewQuestion(question, index)
              )}

              <div className="text-center mt-6">
                <Button 
                  className="btn-primary px-8 py-3 rounded-lg text-lg font-medium"
                  data-testid="preview-submit-button"
                >
                  Submit Form
                </Button>
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
