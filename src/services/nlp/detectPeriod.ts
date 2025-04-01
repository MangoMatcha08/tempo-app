
import { mockPeriods } from '@/utils/reminderUtils';

// Helper function to detect period from text with improved robustness
export const detectPeriod = (text: string): { periodId?: string, isNewPeriod: boolean, periodName?: string } => {
  const lowercaseText = text.toLowerCase();
  const result = { periodId: undefined as string | undefined, isNewPeriod: false, periodName: undefined as string | undefined };
  
  // Check for 'before school' or 'after school' periods
  if (lowercaseText.includes('before school') || 
      lowercaseText.includes('morning') || 
      lowercaseText.includes('early morning')) {
    // Look for existing 'Before School' period
    const beforeSchoolPeriod = mockPeriods.find(p => 
      p.name.toLowerCase().includes('before school') || 
      p.name.toLowerCase().includes('morning')
    );
    
    if (beforeSchoolPeriod) {
      result.periodId = beforeSchoolPeriod.id;
      return result;
    } else {
      // This is a new period
      result.isNewPeriod = true;
      result.periodName = 'Before School';
      return result;
    }
  }
  
  if (lowercaseText.includes('after school') || 
      lowercaseText.includes('afterschool') || 
      lowercaseText.includes('end of day') ||
      lowercaseText.includes('afternoon')) {
    // Look for existing 'After School' period
    const afterSchoolPeriod = mockPeriods.find(p => 
      p.name.toLowerCase().includes('after school')
    );
    
    if (afterSchoolPeriod) {
      result.periodId = afterSchoolPeriod.id;
      return result;
    } else {
      // This is a new period
      result.isNewPeriod = true;
      result.periodName = 'After School';
      return result;
    }
  }
  
  // Check for planning/prep periods
  if (lowercaseText.includes('planning') || 
      lowercaseText.includes('prep') || 
      lowercaseText.includes('preparation') ||
      lowercaseText.includes('prep period') ||
      lowercaseText.includes('free period')) {
    // Look for existing planning period
    const planningPeriod = mockPeriods.find(p => 
      p.name.toLowerCase().includes('planning') ||
      p.name.toLowerCase().includes('prep') ||
      p.name.toLowerCase().includes('preparation')
    );
    
    if (planningPeriod) {
      result.periodId = planningPeriod.id;
      return result;
    } else {
      // This is a new period
      result.isNewPeriod = true;
      result.periodName = 'Planning/Prep Period';
      return result;
    }
  }
  
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
        p.name.toLowerCase().includes(`period ${num}`) || 
        p.name.toLowerCase() === `period${num}` ||
        p.name.toLowerCase() === `p${num}` ||
        p.name === `${num}`
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
    if (lowercaseText.includes(`${textNum} period`) || 
        lowercaseText.includes(`${textNum}-period`) ||
        lowercaseText.includes(`${textNum} class`)) {
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
  
  // Check for special periods like lunch, etc.
  const specialPeriods = [
    { keywords: ['lunch', 'noon', 'break', 'mid-day', 'midday'], name: 'Lunch' },
    { keywords: ['homeroom', 'home room', 'advisory'], name: 'Homeroom' }
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
