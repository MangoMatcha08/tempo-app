
import React, { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChecklistSectionProps } from './types';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const ChecklistSection: React.FC<ChecklistSectionProps> = ({
  checklist,
  setChecklist,
  showChecklist,
  setShowChecklist
}) => {
  const [newChecklistItem, setNewChecklistItem] = useState('');
  
  const addChecklistItem = () => {
    if (newChecklistItem.trim()) {
      setChecklist([
        ...checklist,
        { id: uuidv4(), text: newChecklistItem, isCompleted: false }
      ]);
      setNewChecklistItem('');
    }
  };
  
  const removeChecklistItem = (id: string) => {
    setChecklist(checklist.filter(item => item.id !== id));
  };
  
  const toggleChecklistItem = (id: string) => {
    setChecklist(checklist.map(item => 
      item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
    ));
  };
  
  return (
    <div className="space-y-2">
      <Collapsible>
        <div className="flex items-center justify-between">
          <Label>Checklist</Label>
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowChecklist(!showChecklist)}
            >
              {showChecklist ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
        </div>
        
        <CollapsibleContent>
          <div className="space-y-2 pl-2 mt-2 border-l-2 border-muted">
            {checklist.map(item => (
              <div key={item.id} className="flex items-center space-x-2">
                <Checkbox 
                  id={`checklist-${item.id}`}
                  checked={item.isCompleted}
                  onCheckedChange={() => toggleChecklistItem(item.id)}
                />
                <Label htmlFor={`checklist-${item.id}`} className="flex-1 font-normal">
                  {item.text}
                </Label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => removeChecklistItem(item.id)}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            ))}
            
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Add checklist item"
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addChecklistItem();
                  }
                }}
              />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={addChecklistItem}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default ChecklistSection;
