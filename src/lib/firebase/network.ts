
// Monitor online status
export const setupNetworkMonitoring = (
  onOnline: () => void,
  onOffline: () => void
) => {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
};

// Ping Firebase to verify connection
export const pingFirebase = async () => {
  try {
    const response = await fetch('https://firestore.googleapis.com/google.firestore.v1.Firestore/Listen/channel', {
      method: 'POST',
      mode: 'no-cors',
    });
    return { success: true };
  } catch (error) {
    console.error("Firebase ping failed:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error(String(error)) 
    };
  }
};
