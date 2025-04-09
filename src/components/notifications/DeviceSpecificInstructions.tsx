
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Smartphone, Share, PlusSquare, Home } from "lucide-react";
import { browserDetection } from '@/utils/browserDetection';

export type InstructionStep = {
  icon: React.ReactNode;
  title: string;
  description: string;
  imageUrl?: string;
};

const getDeviceSpecificSteps = (): InstructionStep[] => {
  const isIOS = browserDetection.isIOS();
  
  if (isIOS) {
    return [
      {
        icon: <Share className="h-5 w-5" />,
        title: "Tap the Share Button",
        description: "Look for the share icon in your Safari browser's toolbar",
        imageUrl: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=400&fit=crop"
      },
      {
        icon: <PlusSquare className="h-5 w-5" />,
        title: "Add to Home Screen",
        description: "Scroll down and tap 'Add to Home Screen'",
        imageUrl: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=400&fit=crop"
      },
      {
        icon: <Home className="h-5 w-5" />,
        title: "Install App",
        description: "Tap 'Add' in the top right corner",
        imageUrl: "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=400&fit=crop"
      }
    ];
  }
  
  // Default to generic steps
  return [
    {
      icon: <Smartphone className="h-5 w-5" />,
      title: "Install App",
      description: "Follow your browser's installation prompt",
      imageUrl: "https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=400&fit=crop"
    }
  ];
};

export const DeviceSpecificInstructions: React.FC<{
  currentStep: number;
}> = ({ currentStep }) => {
  const steps = getDeviceSpecificSteps();
  const currentInstruction = steps[currentStep] || steps[0];

  return (
    <Card className="mt-4 overflow-hidden">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          {currentInstruction.icon}
          <div>
            <h3 className="font-medium">{currentInstruction.title}</h3>
            <p className="text-sm text-muted-foreground">
              {currentInstruction.description}
            </p>
          </div>
        </div>
        {currentInstruction.imageUrl && (
          <div className="relative rounded-lg overflow-hidden mt-4">
            <img
              src={currentInstruction.imageUrl}
              alt={currentInstruction.title}
              className="w-full h-48 object-cover"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
