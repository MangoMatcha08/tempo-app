
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { processVoiceInput } from '@/services/nlp/processVoiceInput';
import ModalFooterActions from './ModalFooterActions';
import RefactoredVoiceRecorderView from './RefactoredVoiceRecorderView';
import VoiceReminderConfirmView from '../VoiceReminderConfirmView';
import { createDebugLogger } from '@/utils/debugUtils';

const debugLog = createDebugLogger("VoiceRecorderModal");

interface RefactoredVoiceRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (reminder: any) => Promise<any>;
  onReminderCreated?: (reminder: any) => void;
}

const RefactoredVoiceRecorderModal: React.FC<RefactoredVoiceRecorderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onReminderCreated
}) => {
  const [tab, setTab] = useState<'record' | 'confirm'>('record');
  const [transcript, setTranscript] = useState<string>('');
  const [processedResult, setProcessedResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);

  // Handle cleanup when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setTranscript('');
      setProcessedResult(null);
      setIsProcessing(false);
      setTitle('');
      setTab('record');
      setIsSaving(false);
      setIsRecording(false);
    }
  }, [isOpen]);

  // Process transcript when it's received
  const handleTranscriptComplete = async (text: string) => {
    if (!text.trim()) {
      debugLog("Empty transcript, not processing");
      return;
    }

    setTranscript(text);
    setIsProcessing(true);
    debugLog(`Processing transcript: ${text}`);

    try {
      const result = processVoiceInput(text);
      debugLog("NLP result:", result);
      
      // Set title based on generated reminder
      if (result.reminder && result.reminder.title) {
        setTitle(result.reminder.title);
      }
      
      setProcessedResult(result);
      setTab('confirm');
    } catch (error) {
      console.error("Error processing voice input:", error);
      debugLog(`Error processing voice input: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle saving the reminder
  const handleSaveReminder = async (reminderData: any) => {
    if (isSaving) return;
    
    setIsSaving(true);
    debugLog("Saving reminder:", reminderData);
    
    try {
      const savedReminder = await onSave(reminderData);
      debugLog("Reminder saved successfully:", savedReminder);
      
      if (onReminderCreated) {
        onReminderCreated(savedReminder);
      }
      
      onClose();
    } catch (error) {
      console.error("Error saving reminder:", error);
      debugLog(`Error saving reminder: ${error}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    onClose();
  };

  // Handle recording state changes
  const handleRecordingStart = () => {
    setIsRecording(true);
  };

  const handleRecordingStop = () => {
    setIsRecording(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Voice Reminder</DialogTitle>
          <DialogDescription>
            Record a voice note to create a new reminder.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={tab} onValueChange={(value) => setTab(value as 'record' | 'confirm')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="record" disabled={isRecording}>
              Record
            </TabsTrigger>
            <TabsTrigger 
              value="confirm" 
              disabled={!transcript || isProcessing || isRecording}
            >
              Confirm
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="record" className="space-y-4 py-4">
            <RefactoredVoiceRecorderView 
              isProcessing={isProcessing}
              onTranscriptComplete={handleTranscriptComplete}
              onRecordingStart={handleRecordingStart}
              onRecordingStop={handleRecordingStop}
            />
          </TabsContent>
          
          <TabsContent value="confirm" className="space-y-4 py-4">
            {processedResult && (
              <VoiceReminderConfirmView
                transcript={transcript}
                reminderInput={processedResult.reminder}
                onSave={handleSaveReminder}
                isSaving={isSaving}
              />
            )}
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <ModalFooterActions 
            onCancel={handleCancel}
            isProcessing={isProcessing}
            isSaving={isSaving}
            hasTranscript={!!transcript}
            currentTab={tab}
            isRecording={isRecording}
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RefactoredVoiceRecorderModal;
