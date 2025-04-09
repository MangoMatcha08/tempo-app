
import React from 'react';
import { CheckCircle, XCircle, Smartphone, Wifi, Info } from 'lucide-react';

interface StatusIndicatorsProps {
  isPWA: boolean;
  permissionGranted: boolean;
  serviceWorkerRegistered: boolean;
  serviceWorkerImplementation: string;
}

const StatusIndicators: React.FC<StatusIndicatorsProps> = ({
  isPWA,
  permissionGranted,
  serviceWorkerRegistered,
  serviceWorkerImplementation
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* PWA Status */}
      <div className="flex items-center gap-2 p-3 border rounded-md">
        <div className="bg-slate-100 p-2 rounded-full">
          <Smartphone className="h-4 w-4 text-slate-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">PWA Installation</p>
          <p className="text-xs text-muted-foreground">
            {isPWA ? 'Installed' : 'Not installed'}
          </p>
        </div>
        {isPWA ? (
          <CheckCircle className="h-5 w-5 text-green-500" />
        ) : (
          <XCircle className="h-5 w-5 text-orange-500" />
        )}
      </div>
      
      {/* Permission Status */}
      <div className="flex items-center gap-2 p-3 border rounded-md">
        <div className="bg-slate-100 p-2 rounded-full">
          <Info className="h-4 w-4 text-slate-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">Push Permission</p>
          <p className="text-xs text-muted-foreground">
            {permissionGranted ? 'Granted' : 'Not granted'}
          </p>
        </div>
        {permissionGranted ? (
          <CheckCircle className="h-5 w-5 text-green-500" />
        ) : (
          <XCircle className="h-5 w-5 text-orange-500" />
        )}
      </div>
      
      {/* Service Worker Status */}
      <div className="flex items-center gap-2 p-3 border rounded-md">
        <div className="bg-slate-100 p-2 rounded-full">
          <Wifi className="h-4 w-4 text-slate-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">Service Worker</p>
          <p className="text-xs text-muted-foreground">
            {serviceWorkerRegistered 
              ? `Active (${serviceWorkerImplementation})` 
              : 'Not registered'}
          </p>
        </div>
        {serviceWorkerRegistered ? (
          <CheckCircle className="h-5 w-5 text-green-500" />
        ) : (
          <XCircle className="h-5 w-5 text-orange-500" />
        )}
      </div>
    </div>
  );
};

export default StatusIndicators;
