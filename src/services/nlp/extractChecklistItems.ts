
// Helper function to extract checklist items from text
export const extractChecklistItems = (text: string): string[] => {
  const items: string[] = [];
  
  // Split by common list indicators
  const lines = text.split(/\n|;|,/).map(line => line.trim());
  
  for (const line of lines) {
    // Skip empty lines or very short fragments
    if (line.length < 3) continue;
    
    // Check for list-like patterns
    if (
      line.startsWith('-') || 
      line.startsWith('•') || 
      line.match(/^\d+\./) ||
      line.startsWith('*')
    ) {
      // Remove the list marker and add to items
      const cleanItem = line.replace(/^[-•*\d.]+\s*/, '').trim();
      if (cleanItem.length > 0) {
        items.push(cleanItem);
      }
    } else if (
      line.toLowerCase().includes('remember to') || 
      line.toLowerCase().includes('don\'t forget to') ||
      line.toLowerCase().includes('need to')
    ) {
      items.push(line);
    }
  }
  
  return items;
};
