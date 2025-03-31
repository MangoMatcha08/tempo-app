
import { mockPeriods } from '@/utils/reminderUtils';

// Helper function to detect period from text with improved robustness
export const detectPeriod = (text: string): { periodId?: string, isNewPeriod: boolean, periodName?: string } => {
  const lowercaseText = text.toLowerCase();
  const result = { periodId: undefined as string | undefined, isNewPeriod: false, periodName: undefined as string | undefined };
  
  // First check for exact matches with existing periods
  for (const period of mockPeriods) {
    if (lowercaseText.includes(period.name.toLowerCase())) {
      result.periodId = period.id;
      return result;
    }
  }
  
  // Check for numeric period references (1st, 2nd, 3rd, 4th, etc.)
  const periodRegex = /(\d+)(st|nd|rd|th)?\s*period|period\s*(\d+)/i;
  const match = lowercaseText.match(periodRegex);
  
  if (match) {
    // Extract the period number
    const periodNumber = match[1] || match[3];
    if (periodNumber) {
      // Convert to number and find matching period
      const num = parseInt(periodNumber, 10);
      
      // Look for a period with this number in the name
      const periodMatch = mockPeriods.find(p => 
        p.name.toLowerCase().includes(`period ${num}`) || 
        p.name.toLowerCase().includes(`period${num}`)
      );
      
      if (periodMatch) {
        result.periodId = periodMatch.id;
        return result;
      } else {
        // This is a new period that doesn't exist in our list
        result.isNewPeriod = true;
        result.periodName = `Period ${num}`;
        return result;
      }
    }
  }
  
  // Check for textual period numbers (first, second, third, fourth, etc.)
  const textualPeriods: Record<string, number> = {
    'first': 1,
    'second': 2,
    'third': 3,
    'fourth': 4,
    'fifth': 5,
    'sixth': 6,
    'seventh': 7,
    'eighth': 8,
    'ninth': 9,
    'tenth': 10
  };
  
  for (const [textNum, num] of Object.entries(textualPeriods)) {
    if (lowercaseText.includes(`${textNum} period`) || lowercaseText.includes(`${textNum}-period`)) {
      // Look for a period with this number in the name
      const periodMatch = mockPeriods.find(p => 
        p.name.toLowerCase().includes(`period ${num}`) || 
        p.name.toLowerCase() === `period ${num}` ||
        p.name.toLowerCase() === `${textNum} period`
      );
      
      if (periodMatch) {
        result.periodId = periodMatch.id;
        return result;
      } else {
        // This is a new period that doesn't exist in our list
        result.isNewPeriod = true;
        result.periodName = `Period ${num}`;
        return result;
      }
    }
  }
  
  // Check for special periods like lunch, planning, etc.
  const specialPeriods = [
    { keywords: ['lunch', 'noon'], name: 'Lunch' },
    { keywords: ['planning', 'prep time', 'preparation time'], name: 'Planning' },
    { keywords: ['after school', 'afterschool'], name: 'After School' },
    { keywords: ['morning', 'before school', 'homeroom'], name: 'Morning' }
  ];
  
  for (const special of specialPeriods) {
    for (const keyword of special.keywords) {
      if (lowercaseText.includes(keyword)) {
        // Look for a period with this name
        const periodMatch = mockPeriods.find(p => 
          p.name.toLowerCase().includes(special.name.toLowerCase())
        );
        
        if (periodMatch) {
          result.periodId = periodMatch.id;
          return result;
        } else {
          // This is a new period that doesn't exist in our list
          result.isNewPeriod = true;
          result.periodName = special.name;
          return result;
        }
      }
    }
  }
  
  // No period detected
  return result;
};
