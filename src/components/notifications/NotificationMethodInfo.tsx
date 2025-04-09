
import React from 'react';
import { useNotificationDelivery } from '@/hooks/notifications/useNotificationDelivery';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Settings, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationMethod } from '@/utils/notificationCapabilities';

const NotificationMethodInfo = () => {
  const { 
    getBestMethod, 
    isPermissionGranted, 
    requestPermission,
    getPlatformInfo
  } = useNotificationDelivery();
  
  const [currentMethod, setCurrentMethod] = React.useState<NotificationMethod>(getBestMethod());
  const [permissionStatus, setPermissionStatus] = React.useState<boolean>(isPermissionGranted());
  const [platformInfo, setPlatformInfo] = React.useState(getPlatformInfo());
  
  // Update when component mounts
  React.useEffect(() => {
    setCurrentMethod(getBestMethod());
    setPermissionStatus(isPermissionGranted());
    setPlatformInfo(getPlatformInfo());
  }, [getBestMethod, isPermissionGranted, getPlatformInfo]);

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    setPermissionStatus(granted);
    setCurrentMethod(getBestMethod()); // Update method after permission changes
  };

  const getMethodLabel = (method: NotificationMethod) => {
    switch (method) {
      case NotificationMethod.WEB_PUSH:
        return 'Web Push';
      case NotificationMethod.SERVICE_WORKER:
        return 'Service Worker';
      case NotificationMethod.NATIVE_PUSH:
        return 'Native Push';
      case NotificationMethod.IN_APP:
        return 'In-App';
      case NotificationMethod.FALLBACK:
        return 'Fallback';
      default:
        return 'Unknown';
    }
  };

  const getMethodColor = (method: NotificationMethod) => {
    switch (method) {
      case NotificationMethod.WEB_PUSH:
        return 'bg-green-500 hover:bg-green-600';
      case NotificationMethod.SERVICE_WORKER:
        return 'bg-blue-500 hover:bg-blue-600';
      case NotificationMethod.NATIVE_PUSH:
        return 'bg-purple-500 hover:bg-purple-600';
      case NotificationMethod.IN_APP:
        return 'bg-amber-500 hover:bg-amber-600';
      case NotificationMethod.FALLBACK:
        return 'bg-gray-500 hover:bg-gray-600';
      default:
        return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Notification Delivery
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium mb-2">Current Method</p>
          <Badge className={getMethodColor(currentMethod)}>
            {getMethodLabel(currentMethod)}
          </Badge>
        </div>
        
        <div>
          <p className="text-sm font-medium mb-2">Permission Status</p>
          <div className="flex items-center gap-2">
            {permissionStatus ? (
              <Badge variant="outline" className="border-green-500 text-green-600 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Granted
              </Badge>
            ) : (
              <Badge variant="outline" className="border-amber-500 text-amber-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Not Granted
              </Badge>
            )}
            
            {!permissionStatus && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleRequestPermission}
                className="ml-2"
              >
                Request Permission
              </Button>
            )}
          </div>
        </div>
        
        <div>
          <p className="text-sm font-medium mb-2">Platform</p>
          <div className="text-sm space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {platformInfo.name} {platformInfo.version || ''}
              </Badge>
              
              {platformInfo.isIOS && <Badge className="bg-blue-100 text-blue-800">iOS</Badge>}
              {platformInfo.isAndroid && <Badge className="bg-green-100 text-green-800">Android</Badge>}
              {platformInfo.isDesktop && <Badge className="bg-purple-100 text-purple-800">Desktop</Badge>}
              {platformInfo.isPWA && <Badge className="bg-rose-100 text-rose-800">PWA</Badge>}
            </div>
          </div>
        </div>
        
        <div className="pt-2">
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-blue-100 text-blue-800">
            <Info className="mr-1 h-3 w-3" />
            <span>Using new notification architecture</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationMethodInfo;
