import { useState, useCallback } from 'react';
import { Question, QuestionType, WorkflowConfig, FormBuilderState } from '@/lib/types';
import { nanoid } from 'nanoid';

export function useFormBuilder() {
  const [formState, setFormState] = useState<FormBuilderState>({
    title: '',
    description: '',
    questions: [],
    workflowConfig: {
      emailNotifications: false,
      slackNotifications: false,
      requireApproval: false,
      approverEmail: '',
    },
  });

  const addQuestion = useCallback((type: QuestionType) => {
    let questionId: string;
    
    setFormState(prev => {
      const newQuestion: Question = {
        id: nanoid(),
        type,
        title: `Question ${prev.questions.length + 1}`,
        required: false,
      };

      if (type === 'multiple-choice' || type === 'checkboxes') {
        newQuestion.options = ['Option 1', 'Option 2'];
      }

      questionId = newQuestion.id;
      return {
        ...prev,
        questions: [...prev.questions, newQuestion],
      };
    });

    return questionId!;
  }, []);

  const updateQuestion = useCallback((id: string, updates: Partial<Question>) => {
    console.log('updateQuestion called:', id, updates);
    setFormState(prev => {
      const updatedQuestions = prev.questions.map(q => 
        q.id === id ? { ...q, ...updates } : q
      );
      console.log('Updated questions:', updatedQuestions);
      return {
        ...prev,
        questions: updatedQuestions,
      };
    });
  }, []);

  const deleteQuestion = useCallback((id: string) => {
    setFormState(prev => ({
      ...prev,
      questions: prev.questions.filter(q => q.id !== id),
    }));
  }, []);

  const reorderQuestions = useCallback((startIndex: number, endIndex: number) => {
    setFormState(prev => {
      const newQuestions = [...prev.questions];
      const [removed] = newQuestions.splice(startIndex, 1);
      newQuestions.splice(endIndex, 0, removed);
      return { ...prev, questions: newQuestions };
    });
  }, []);

  const updateFormTitle = useCallback((title: string) => {
    setFormState(prev => ({ ...prev, title }));
  }, []);

  const updateFormDescription = useCallback((description: string) => {
    setFormState(prev => ({ ...prev, description }));
  }, []);

  const updateWorkflowConfig = useCallback((updates: Partial<WorkflowConfig>) => {
    setFormState(prev => ({
      ...prev,
      workflowConfig: { ...prev.workflowConfig, ...updates },
    }));
  }, []);

  const resetForm = useCallback(() => {
    setFormState({
      title: '',
      description: '',
      questions: [],
      workflowConfig: {
        emailNotifications: false,
        slackNotifications: false,
        requireApproval: false,
        approverEmail: '',
      },
    });
  }, []);

  const loadFormData = useCallback((formData: FormBuilderState) => {
    setFormState(formData);
  }, []);

  return {
    formState,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    reorderQuestions,
    updateFormTitle,
    updateFormDescription,
    updateWorkflowConfig,
    resetForm,
    loadFormData,
  };
}
