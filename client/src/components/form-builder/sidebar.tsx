import { QuestionType } from "@/lib/types";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const questionTypes: Array<{
  type: QuestionType;
  icon: string;
  title: string;
  description: string;
  gradient: string;
}> = [
  {
    type: "multiple-choice",
    icon: "fas fa-list-ul",
    title: "Multiple Choice",
    description: "Single selection",
    gradient: "from-purple-500 to-blue-500",
  },
  {
    type: "checkboxes",
    icon: "fas fa-check-square",
    title: "Checkboxes",
    description: "Multiple selection",
    gradient: "from-blue-500 to-pink-500",
  },
  {
    type: "text-field",
    icon: "fas fa-font",
    title: "Text Field",
    description: "Short answer",
    gradient: "from-pink-500 to-purple-500",
  },
  {
    type: "long-text",
    icon: "fas fa-align-left",
    title: "Long Text",
    description: "Paragraph + AI",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    type: "number",
    icon: "fas fa-hashtag",
    title: "Number",
    description: "Numeric input",
    gradient: "from-blue-500 to-purple-500",
  },
  {
    type: "date",
    icon: "fas fa-calendar",
    title: "Date",
    description: "Date picker",
    gradient: "from-pink-500 to-blue-500",
  },
];

interface SidebarProps {
  onDragStart: (type: QuestionType) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ onDragStart, isOpen, onClose }: SidebarProps) {
  const [draggedType, setDraggedType] = useState<QuestionType | null>(null);

  const handleDragStart = (e: React.DragEvent, type: QuestionType) => {
    setDraggedType(type);
    
    // Set data in multiple formats for better compatibility
    e.dataTransfer.setData('application/json', JSON.stringify({ type }));
    e.dataTransfer.setData('text/plain', type);
    e.dataTransfer.effectAllowed = 'copy';
    
    console.log('Starting drag for question type:', type);
    onDragStart(type);
  };

  const handleDragEnd = () => {
    setDraggedType(null);
  };

  return (
    <div 
      className={`
        sidebar w-80 bg-black bg-opacity-20 backdrop-blur-xl border-r border-white border-opacity-20 p-6 
        fixed lg:relative z-50 h-full transition-transform duration-300
        ${isOpen ? 'sidebar-active' : ''}
      `}
      data-testid="form-builder-sidebar"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Form Builder
          </h2>
          <p className="text-sm text-gray-400">Drag & Drop Elements</p>
        </div>
        <Button
          variant="ghost"
          className="lg:hidden text-white hover:text-purple-400"
          onClick={onClose}
          data-testid="sidebar-close-button"
        >
          <i className="fas fa-times text-xl"></i>
        </Button>
      </div>

      {/* Question Types */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
          Question Types
        </h3>

        {questionTypes.map((questionType) => (
          <GlassCard
            key={questionType.type}
            className={`
              p-4 cursor-grab active:cursor-grabbing transition-transform
              ${draggedType === questionType.type ? 'scale-105' : ''}
            `}
          >
            <div
              draggable
              onDragStart={(e) => handleDragStart(e, questionType.type)}
              onDragEnd={handleDragEnd}
              className="flex items-center space-x-3"
              data-testid={`drag-item-${questionType.type}`}
            >
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${questionType.gradient} flex items-center justify-center`}>
                <i className={`${questionType.icon} text-white text-sm`}></i>
              </div>
              <div>
                <h4 className="font-medium text-white">{questionType.title}</h4>
                <p className="text-xs text-gray-400">{questionType.description}</p>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* AI Configuration */}
      <div className="mt-8">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
          AI Assistant
        </h3>
        <GlassCard className="p-4">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
              <i className="fas fa-robot text-white text-xs"></i>
            </div>
            <span className="text-sm font-medium text-white">Claude Sonnet 4</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Status</span>
            <span className="text-xs text-green-400 flex items-center">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></div>
              Connected
            </span>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
