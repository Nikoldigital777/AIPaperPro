import { Question, QuestionType } from "@/lib/types";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";

interface QuestionItemProps {
  question: Question;
  onUpdate: (id: string, updates: Partial<Question>) => void;
  onDelete: (id: string) => void;
  onConfigureAI?: (id: string) => void;
}

export function QuestionItem({ question, onUpdate, onDelete, onConfigureAI }: QuestionItemProps) {
  const [options, setOptions] = useState(question.options ?? []);
  const [title, setTitle] = useState(question.title ?? '');

  // Update local state when question prop changes
  useEffect(() => {
    setTitle(question.title ?? '');
    setOptions(question.options ?? []);
  }, [question.title, question.options]);

  const updateTitle = (newTitle: string) => {
    console.log('Updating question title:', newTitle, 'for question:', question.id);
    setTitle(newTitle);
    onUpdate(question.id, { title: newTitle });
  };

  const addOption = () => {
    const newOptions = [...options, `Option ${options.length + 1}`];
    setOptions(newOptions);
    onUpdate(question.id, { options: newOptions });
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
    onUpdate(question.id, { options: newOptions });
  };

  const removeOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
    onUpdate(question.id, { options: newOptions });
  };

  const renderQuestionInput = () => {
    switch (question.type) {
      case 'multiple-choice':
        return (
          <div className="space-y-2">
            {options.map((option, index) => (
              <div key={index} className="flex items-center space-x-3">
                <input type="radio" disabled className="flex-shrink-0" />
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  className="flex-1 bg-white/10 text-white border border-purple-500/30 rounded px-3 py-2 focus:border-purple-400 focus:outline-none"
                  placeholder={`Option ${index + 1}`}
                  data-testid={`option-input-${index}`}
                  autoComplete="off"
                />
                {options.length > 2 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOption(index)}
                    className="text-red-400 hover:text-red-300"
                    data-testid={`remove-option-${index}`}
                  >
                    <i className="fas fa-times"></i>
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="ghost"
              onClick={addOption}
              className="text-purple-400 text-sm hover:text-purple-300"
              data-testid="add-option-button"
            >
              <i className="fas fa-plus mr-1"></i>Add option
            </Button>
          </div>
        );

      case 'checkboxes':
        return (
          <div className="space-y-2">
            {options.map((option, index) => (
              <div key={index} className="flex items-center space-x-3">
                <input type="checkbox" disabled className="flex-shrink-0" />
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  className="flex-1 bg-white/10 text-white border border-purple-500/30 rounded px-3 py-2 focus:border-purple-400 focus:outline-none"
                  placeholder={`Option ${index + 1}`}
                  data-testid={`checkbox-option-input-${index}`}
                  autoComplete="off"
                />
                {options.length > 2 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeOption(index)}
                    className="text-red-400 hover:text-red-300"
                    data-testid={`remove-checkbox-option-${index}`}
                  >
                    <i className="fas fa-times"></i>
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="ghost"
              onClick={addOption}
              className="text-purple-400 text-sm hover:text-purple-300"
              data-testid="add-checkbox-option-button"
            >
              <i className="fas fa-plus mr-1"></i>Add option
            </Button>
          </div>
        );

      case 'text-field':
        return (
          <Input
            placeholder="Short answer text"
            disabled
            className="w-full"
            data-testid="text-field-preview"
          />
        );

      case 'long-text':
        return (
          <div>
            <Textarea
              placeholder="Long answer text"
              disabled
              className="w-full h-24 resize-none"
              data-testid="long-text-preview"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-gray-400">AI Enhancement: Enabled</span>
              <i className="fas fa-robot text-purple-400"></i>
            </div>
          </div>
        );

      case 'number':
        return (
          <Input
            type="number"
            placeholder="123"
            disabled
            className="w-full"
            data-testid="number-field-preview"
          />
        );

      case 'date':
        return (
          <Input
            type="date"
            disabled
            className="w-full"
            data-testid="date-field-preview"
          />
        );

      default:
        return null;
    }
  };

  return (
    <GlassCard className="question-item p-6" data-testid={`question-item-${question.id}`}>
      <div className="flex items-center justify-between mb-4">
        <input
          type="text"
          value={title ?? ''}
          onChange={(e) => {
            console.log('Typing in question title:', e.target.value);
            updateTitle(e.target.value);
          }}
          className="bg-white/10 text-lg font-medium text-white border-2 border-purple-500/50 rounded-lg px-4 py-2 flex-1 focus:border-purple-400 focus:outline-none focus:bg-white/20 w-full"
          placeholder="Click to edit question title"
          data-testid="question-title-input"
        />
        <div className="flex items-center space-x-2">
          {question.type === 'long-text' && onConfigureAI && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onConfigureAI(question.id)}
              className="text-purple-400 hover:text-purple-300"
              title="Configure AI"
              data-testid="configure-ai-button"
            >
              <i className="fas fa-robot"></i>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(question.id)}
            className="text-red-400 hover:text-red-300"
            data-testid="delete-question-button"
          >
            <i className="fas fa-trash"></i>
          </Button>
        </div>
      </div>

      {renderQuestionInput()}
    </GlassCard>
  );
}
