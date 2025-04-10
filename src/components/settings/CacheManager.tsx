
import React, { useState, useEffect } from "react";
import { serviceWorkerManager } from "@/services/notifications/ServiceWorkerManager";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, RefreshCw, BarChart3, Database, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { CacheStatistics } from "@/types/notifications/serviceWorkerTypes";
import { useServiceWorker } from "@/hooks/useServiceWorker";
import { formatDistanceToNow } from "date-fns";

const CacheManager = () => {
  const { implementation } = useServiceWorker();
  const [stats, setStats] = useState<CacheStatistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maintenanceRunning, setMaintenanceRunning] = useState(false);
  
  // Load cache statistics
  const loadStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const initialized = await serviceWorkerManager.initialize();
      if (!initialized) {
        setError("Service worker not available");
        setLoading(false);
        return;
      }
      
      const cacheStats = await serviceWorkerManager.getCacheStats();
      
      if (cacheStats.error) {
        setError(cacheStats.error);
      } else {
        setStats(cacheStats);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load cache statistics");
    } finally {
      setLoading(false);
    }
  };
  
  // Run cache maintenance
  const runMaintenance = async () => {
    setMaintenanceRunning(true);
    setError(null);
    
    try {
      await serviceWorkerManager.initialize();
      const success = await serviceWorkerManager.triggerCacheMaintenance();
      
      if (!success) {
        setError("Cache maintenance failed");
      }
      
      // Refresh stats after a delay
      setTimeout(loadStats, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run cache maintenance");
    } finally {
      setMaintenanceRunning(false);
    }
  };
  
  // Clear specific cache
  const clearCache = async (cacheType?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await serviceWorkerManager.initialize();
      const success = await serviceWorkerManager.clearCache(cacheType as any);
      
      if (!success) {
        setError(`Failed to clear ${cacheType || "all"} cache`);
      }
      
      // Refresh stats after a delay
      setTimeout(loadStats, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear cache");
    } finally {
      setLoading(false);
    }
  };
  
  // Format file size for display
  const formatSize = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    
    return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
  };
  
  // Format date for display
  const formatDate = (timestamp?: number): string => {
    if (!timestamp) return "Unknown";
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };
  
  // Set up message listener for cache maintenance completion
  useEffect(() => {
    const unsubscribe = serviceWorkerManager.registerMessageListener((message) => {
      if (message.type === "CACHE_MAINTENANCE_COMPLETE") {
        setMaintenanceRunning(false);
        loadStats();
      } else if (message.type === "CACHE_STATS") {
        if (message.payload?.stats) {
          setStats(message.payload.stats as CacheStatistics);
        }
      }
    });
    
    // Load stats on mount
    loadStats();
    
    return unsubscribe;
  }, []);
  
  if (implementation !== 'enhanced') {
    return (
      <Alert className="bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800/30 dark:text-amber-400">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Advanced cache management features are only available when using the enhanced service worker implementation.
        </AlertDescription>
      </Alert>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Cache Management
        </CardTitle>
        <CardDescription>
          Manage notification and application caching for offline use and performance
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Cache Status</h3>
          <Button 
            variant="outline" 
            size="sm"
            onClick={loadStats}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
        
        {stats ? (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Cache Size</span>
                  <span className="font-medium">{formatSize(stats.totalSize)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Items</span>
                  <span className="font-medium">{stats.totalItems}</span>
                </div>
              </div>
              
              {stats.caches && Object.entries(stats.caches).map(([cacheType, data]) => (
                <div key={cacheType} className="space-y-2 border p-3 rounded-md">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium capitalize">{cacheType} Cache</h4>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-7 text-red-500 hover:text-red-700 hover:bg-red-100"
                      onClick={() => clearCache(cacheType)}
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1" />
                      Clear
                    </Button>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Size</span>
                      <span>{formatSize(data.size)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Items</span>
                      <span>{data.itemCount}</span>
                    </div>
                    
                    {data.newestItem && (
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Last Updated</span>
                        <span>{formatDate(data.newestItem)}</span>
                      </div>
                    )}
                    
                    <Progress 
                      value={(data.size / stats.totalSize) * 100} 
                      className="h-1.5 mt-1"
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : loading ? (
          <div className="flex justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No cache statistics available
          </div>
        )}
      </CardContent>
      
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={runMaintenance}
          disabled={maintenanceRunning}
        >
          {maintenanceRunning ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <BarChart3 className="h-4 w-4 mr-2" />
              Run Maintenance
            </>
          )}
        </Button>
        
        <Button
          variant="destructive"
          onClick={() => clearCache()}
          disabled={loading || maintenanceRunning}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Clear All Caches
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CacheManager;
