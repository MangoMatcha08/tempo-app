
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/contexts/NotificationContext';
import { useToast } from '@/hooks/use-toast';

interface NotificationEnableButtonProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'secondary';
  className?: string;
}

const NotificationEnableButton = ({ 
  size = 'md', 
  variant = 'default',
  className = ''
}: NotificationEnableButtonProps) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const { permissionGranted, requestPermission } = useNotifications();
  const { toast } = useToast();
  
  const handleRequestPermission = async () => {
    if (isRequesting) return;
    
    setIsRequesting(true);
    try {
      const granted = await requestPermission();
      
      if (granted) {
        toast({
          title: "Notifications enabled",
          description: "You will now receive push notifications for reminders",
          duration: 3000
        });
      } else {
        toast({
          title: "Permission not granted",
          description: "Please enable notifications in your browser settings",
          variant: "destructive",
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      toast({
        title: "Error",
        description: "Failed to request notification permission",
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setIsRequesting(false);
    }
  };
  
  const buttonSizes = {
    'sm': 'px-2 py-1 text-xs',
    'md': 'px-4 py-2 text-sm',
    'lg': 'px-5 py-3 text-base'
  };
  
  return (
    <Button
      onClick={handleRequestPermission}
      disabled={isRequesting}
      variant={variant}
      className={`${buttonSizes[size]} ${className}`}
    >
      <Bell className="mr-2 h-4 w-4" />
      {permissionGranted 
        ? "Update Notification Access" 
        : isRequesting 
          ? "Requesting..." 
          : "Enable Notifications"}
    </Button>
  );
};

export default NotificationEnableButton;
