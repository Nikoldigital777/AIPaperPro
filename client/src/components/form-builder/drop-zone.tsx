import { useState } from "react";
import { QuestionType } from "@/lib/types";
import { GlassCard } from "@/components/ui/glass-card";

interface DropZoneProps {
  onDrop: (type: QuestionType) => void;
  children?: React.ReactNode;
  isEmpty: boolean;
}

export function DropZone({ onDrop, children, isEmpty }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const questionData = e.dataTransfer.getData('application/json');
    const questionTypeText = e.dataTransfer.getData('text/plain');
    
    let questionType: string | null = null;
    
    // Try JSON format first
    if (questionData) {
      try {
        const parsed = JSON.parse(questionData);
        questionType = parsed.type;
      } catch (error) {
        console.warn('Failed to parse JSON drag data:', error);
      }
    }
    
    // Fallback to plain text
    if (!questionType && questionTypeText) {
      questionType = questionTypeText;
    }
    
    if (questionType) {
      console.log('Dropping question type:', questionType);
      onDrop(questionType as QuestionType);
    } else {
      console.error('No valid question type data found in drop event');
    }
  };

  if (isEmpty) {
    return (
      <div
        className={`
          drop-zone glass-card rounded-2xl p-8 text-center min-h-96
          ${isDragOver ? 'drag-over' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        data-testid="form-builder-drop-zone"
      >
        <div className="text-gray-400 mb-4">
          <i className="fas fa-plus-circle text-4xl mb-4 opacity-50"></i>
          <h3 className="text-lg font-medium mb-2">Start Building Your Form</h3>
          <p className="text-sm">Drag question types from the sidebar to begin</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`space-y-4 min-h-96 ${isDragOver ? 'drop-zone drag-over rounded-2xl p-4' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      data-testid="form-builder-drop-zone"
    >
      {children}
    </div>
  );
}
