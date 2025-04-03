
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PWATestComponent from '@/components/settings/PWATestComponent';
import VoiceAndPWATestComponent from '@/components/settings/VoiceAndPWATestComponent';
import NotificationTestComponent from '@/hooks/NotificationTestComponent';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const TestPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-6 max-w-[800px]">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => navigate('/dashboard')}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold">Tempo App Testing</h1>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>iOS PWA Compatibility Testing</CardTitle>
          <CardDescription>
            Test voice functionality, push notifications, and other features in iOS PWA environment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="comprehensive">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="comprehensive">Comprehensive</TabsTrigger>
              <TabsTrigger value="pwa">PWA Features</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>
            
            <TabsContent value="comprehensive">
              <VoiceAndPWATestComponent />
            </TabsContent>
            
            <TabsContent value="pwa">
              <PWATestComponent />
            </TabsContent>
            
            <TabsContent value="notifications">
              <NotificationTestComponent />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <div className="text-sm text-gray-500 mt-8">
        <p>Testing Instructions:</p>
        <ol className="list-decimal pl-5 space-y-2 mt-2">
          <li>To test as a PWA on iOS, add this app to your home screen and launch it from there.</li>
          <li>Test voice functionality by clicking the "Test Voice Recognition" button in the Comprehensive tab.</li>
          <li>Test push notifications by enabling notifications and clicking the "Send Test Notification" button.</li>
          <li>Check feature compatibility in the PWA Features tab to see which features are supported on your device.</li>
        </ol>
      </div>
    </div>
  );
};

export default TestPage;
