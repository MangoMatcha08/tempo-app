
import { mockPeriods } from '@/utils/reminderUtils';

// Helper function to detect period from text with improved robustness
export const detectPeriod = (text: string): { periodId?: string, isNewPeriod: boolean, periodName?: string } => {
  const lowercaseText = text.toLowerCase();
  const result = { periodId: undefined as string | undefined, isNewPeriod: false, periodName: undefined as string | undefined };
  
  console.log("Detecting period from text:", lowercaseText);
  
  // Check for 'before school' or 'after school' periods with more variations
  const afterSchoolPatterns = [
    'after school', 
    'afterschool', 
    'end of day', 
    'end of the day',
    'afternoon',
    'after class',
    'after classes',
    'post school',
    'when school ends',
    'when school is over'
  ];
  
  // Check for after school patterns
  for (const pattern of afterSchoolPatterns) {
    if (lowercaseText.includes(pattern)) {
      console.log(`Detected after school pattern: ${pattern}`);
      // Look for existing 'After School' period
      const afterSchoolPeriod = mockPeriods.find(p => 
        p.name.toLowerCase().includes('after school') ||
        p.name.toLowerCase() === 'after school'
      );
      
      if (afterSchoolPeriod) {
        console.log("Found existing After School period:", afterSchoolPeriod);
        result.periodId = afterSchoolPeriod.id;
        return result;
      } else {
        // This is a new period
        console.log("Creating new After School period");
        result.isNewPeriod = true;
        result.periodName = 'After School';
        return result;
      }
    }
  }
  
  const beforeSchoolPatterns = [
    'before school',
    'beforeschool',
    'morning',
    'early morning',
    'start of day',
    'start of the day',
    'before class',
    'before classes'
  ];
  
  // Check for before school patterns
  for (const pattern of beforeSchoolPatterns) {
    if (lowercaseText.includes(pattern)) {
      console.log(`Detected before school pattern: ${pattern}`);
      // Look for existing 'Before School' period
      const beforeSchoolPeriod = mockPeriods.find(p => 
        p.name.toLowerCase().includes('before school') || 
        p.name.toLowerCase().includes('morning')
      );
      
      if (beforeSchoolPeriod) {
        console.log("Found existing Before School period:", beforeSchoolPeriod);
        result.periodId = beforeSchoolPeriod.id;
        return result;
      } else {
        // This is a new period
        console.log("Creating new Before School period");
        result.isNewPeriod = true;
        result.periodName = 'Before School';
        return result;
      }
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
  
  // Enhanced period detection with various formats - matched by number
  const periodNumberMap: Record<string, number> = {
    'first': 1, 'one': 1, '1st': 1, '1': 1,
    'second': 2, 'two': 2, '2nd': 2, '2': 2,
    'third': 3, 'three': 3, '3rd': 3, '3': 3,
    'fourth': 4, 'four': 4, '4th': 4, '4': 4,
    'fifth': 5, 'five': 5, '5th': 5, '5': 5,
    'sixth': 6, 'six': 6, '6th': 6, '6': 6,
    'seventh': 7, 'seven': 7, '7th': 7, '7': 7,
    'eighth': 8, 'eight': 8, '8th': 8, '8': 8,
    'ninth': 9, 'nine': 9, '9th': 9, '9': 9,
    'tenth': 10, 'ten': 10, '10th': 10, '10': 10
  };
  
  // Match period number references regardless of format
  for (const [word, num] of Object.entries(periodNumberMap)) {
    // Various patterns to match
    const patterns = [
      `${word} period`,
      `period ${word}`,
      `period ${num}`,
      `p${num}`,
      `${word}-period`,
      `${num} period`,
      `${num}th period`,
      `${num}nd period`,
      `${num}rd period`,
      `${num}st period`,
    ];
    
    for (const pattern of patterns) {
      if (lowercaseText.includes(pattern)) {
        // Look for a period with this number
        const periodMatch = mockPeriods.find(p => {
          const periodNameLower = p.name.toLowerCase();
          return (
            periodNameLower.includes(`period ${num}`) ||
            periodNameLower === `period ${num}` ||
            periodNameLower === `${word} period` ||
            periodNameLower === `period ${word}` ||
            periodNameLower === `p${num}` ||
            periodNameLower.includes(`period ${num}`) ||
            (p.name === `Period ${num}`)
          );
        });
        
        if (periodMatch) {
          result.periodId = periodMatch.id;
          return result;
        } else {
          // This is a new period
          result.isNewPeriod = true;
          result.periodName = `Period ${num}`;
          return result;
        }
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
  
  console.log("No period detected in text");
  // No period detected
  return result;
};
