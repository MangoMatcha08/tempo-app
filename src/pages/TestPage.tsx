
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NotificationTestComponent } from '@/hooks/NotificationTestComponent';

const TestPage = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Test Page</h1>
      
      <Tabs defaultValue="notifications" className="w-full">
        <TabsList>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="others">Other Tests</TabsTrigger>
        </TabsList>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Permission Test</CardTitle>
            </CardHeader>
            <CardContent>
              <NotificationTestComponent />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="others">
          <Card>
            <CardHeader>
              <CardTitle>Other Test Components</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Add other test components here as needed.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TestPage;
