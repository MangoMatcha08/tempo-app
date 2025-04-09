
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import EnhancedIOSPWAInstallGuide from './EnhancedIOSPWAInstallGuide';
import { browserDetection } from '@/utils/browserDetection';

/**
 * Demo component to showcase the iOS PWA installation guide
 */
const IOSPushInstallDemo = () => {
  const [showGuide, setShowGuide] = useState(false);
  
  const toggleGuide = () => {
    setShowGuide(prev => !prev);
  };
  
  const handleComplete = () => {
    console.log("Installation guide completed!");
    // In a real implementation, we would trigger the push permission flow next
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>iOS Push Notification Setup</CardTitle>
        <CardDescription>
          Phase 1: Installation Guide Demo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {showGuide ? (
          <EnhancedIOSPWAInstallGuide 
            onDismiss={() => setShowGuide(false)}
            onComplete={handleComplete}
          />
        ) : (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              {browserDetection.isIOSSafari() 
                ? "You're using iOS Safari. Try our enhanced installation guide!"
                : browserDetection.isIOSPWA()
                  ? "You're already using the PWA mode. Great!"
                  : browserDetection.isIOS()
                    ? "Please open this site in Safari for the full iOS experience."
                    : "This demo is specific to iOS devices."
              }
            </p>
            <Button onClick={toggleGuide}>
              {showGuide ? "Hide Guide" : "Show Installation Guide"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default IOSPushInstallDemo;
