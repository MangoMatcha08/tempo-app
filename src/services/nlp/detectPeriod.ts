
import { mockPeriods } from '@/utils/reminderUtils';

/**
 * Enhanced period detection with confidence scoring
 * Returns detected periodId and confidence score (0-1)
 */
export const detectPeriod = (text: string): { 
  periodId?: string, 
  isNewPeriod: boolean, 
  periodName?: string,
  confidence: number 
} => {
  const lowercaseText = text.toLowerCase();
  const result = { 
    periodId: undefined as string | undefined, 
    isNewPeriod: false, 
    periodName: undefined as string | undefined,
    confidence: 0 
  };
  
  console.log("Detecting period from text:", lowercaseText);
  
  // First priority: Explicit period numbers (direct matches)
  const explicitPeriodPatterns = [
    // Numeric patterns
    { regex: /\bperiod\s+(\d+)\b/i, format: (num: string) => `Period ${num}`, confidence: 0.95 },
    { regex: /\b(\d+)(st|nd|rd|th)?\s+period\b/i, format: (num: string) => `Period ${num}`, confidence: 0.95 },
    { regex: /\bp(\d+)\b/i, format: (num: string) => `Period ${num}`, confidence: 0.85 },
    
    // Text number patterns
    { regex: /\bfirst\s+period\b/i, periodNumber: "1", confidence: 0.9 },
    { regex: /\bsecond\s+period\b/i, periodNumber: "2", confidence: 0.9 },
    { regex: /\bthird\s+period\b/i, periodNumber: "3", confidence: 0.9 },
    { regex: /\bfourth\s+period\b/i, periodNumber: "4", confidence: 0.9 },
    { regex: /\bfifth\s+period\b/i, periodNumber: "5", confidence: 0.9 },
    { regex: /\bsixth\s+period\b/i, periodNumber: "6", confidence: 0.9 },
    { regex: /\bseventh\s+period\b/i, periodNumber: "7", confidence: 0.9 },
    { regex: /\beighth\s+period\b/i, periodNumber: "8", confidence: 0.9 },
    { regex: /\bninth\s+period\b/i, periodNumber: "9", confidence: 0.9 },
    { regex: /\btenth\s+period\b/i, periodNumber: "10", confidence: 0.9 },
    
    { regex: /\bperiod\s+one\b/i, periodNumber: "1", confidence: 0.85 },
    { regex: /\bperiod\s+two\b/i, periodNumber: "2", confidence: 0.85 },
    { regex: /\bperiod\s+three\b/i, periodNumber: "3", confidence: 0.85 },
    { regex: /\bperiod\s+four\b/i, periodNumber: "4", confidence: 0.85 },
    { regex: /\bperiod\s+five\b/i, periodNumber: "5", confidence: 0.85 },
    { regex: /\bperiod\s+six\b/i, periodNumber: "6", confidence: 0.85 },
    { regex: /\bperiod\s+seven\b/i, periodNumber: "7", confidence: 0.85 },
    { regex: /\bperiod\s+eight\b/i, periodNumber: "8", confidence: 0.85 },
    { regex: /\bperiod\s+nine\b/i, periodNumber: "9", confidence: 0.85 },
    { regex: /\bperiod\s+ten\b/i, periodNumber: "10", confidence: 0.85 },
  ];
  
  // Check for explicit period number references first (highest priority)
  for (const pattern of explicitPeriodPatterns) {
    const match = lowercaseText.match(pattern.regex);
    if (match) {
      let periodNumber;
      
      if (pattern.periodNumber) {
        // For predefined text numbers
        periodNumber = pattern.periodNumber;
      } else if (pattern.format && match[1]) {
        // For regex captures that need formatting
        periodNumber = match[1];
      }
      
      if (periodNumber) {
        // Look for existing period with this number
        const periodMatch = mockPeriods.find(p => 
          p.name === `Period ${periodNumber}` || 
          p.name.toLowerCase().includes(`period ${periodNumber.toLowerCase()}`)
        );
        
        if (periodMatch) {
          console.log(`Found explicit period match: ${periodMatch.name} with confidence ${pattern.confidence}`);
          result.periodId = periodMatch.id;
          result.confidence = pattern.confidence;
          return result;
        } else {
          // This is a new period that doesn't exist
          console.log(`Creating new period: Period ${periodNumber} with confidence ${pattern.confidence}`);
          result.isNewPeriod = true;
          result.periodName = `Period ${periodNumber}`;
          result.confidence = pattern.confidence;
          return result;
        }
      }
    }
  }
  
  // Second priority: Special named periods (like lunch, homeroom)
  const specialPeriods = [
    { keywords: ['lunch', 'noon', 'break', 'mid-day', 'midday'], name: 'Lunch', confidence: 0.8 },
    { keywords: ['homeroom', 'home room', 'advisory'], name: 'Homeroom', confidence: 0.8 },
    { keywords: ['planning', 'prep period', 'preparation period'], name: 'Planning/Prep', confidence: 0.8 },
  ];
  
  for (const special of specialPeriods) {
    for (const keyword of special.keywords) {
      if (lowercaseText.includes(keyword)) {
        // Check for explicit reference (higher confidence)
        const explicitPattern = new RegExp(`\\b(in|during|at|for)\\s+(${keyword})\\b`, 'i');
        const explicitMatch = lowercaseText.match(explicitPattern);
        const currentConfidence = explicitMatch ? special.confidence + 0.1 : special.confidence;
        
        // Look for a period with this name
        const periodMatch = mockPeriods.find(p => 
          p.name.toLowerCase().includes(special.name.toLowerCase())
        );
        
        if (periodMatch) {
          console.log(`Found special period match: ${periodMatch.name} with confidence ${currentConfidence}`);
          result.periodId = periodMatch.id;
          result.confidence = currentConfidence;
          return result;
        } else {
          // This is a new period
          console.log(`Creating new special period: ${special.name} with confidence ${currentConfidence}`);
          result.isNewPeriod = true;
          result.periodName = special.name;
          result.confidence = currentConfidence;
          return result;
        }
      }
    }
  }
  
  // Lowest priority: Before/After school only when explicitly mentioned
  const beforeSchoolPatterns = [
    { regex: /\b(before|prior\s+to)\s+school\b/i, confidence: 0.75 },
    { regex: /\bearl(y|ier)\s+(in|at)\s+(the\s+)?morning\b/i, confidence: 0.7 },
    { regex: /\bstart\s+of\s+(the\s+)?day\b/i, confidence: 0.65 },
  ];
  
  for (const pattern of beforeSchoolPatterns) {
    if (lowercaseText.match(pattern.regex)) {
      console.log(`Detected before school pattern with confidence ${pattern.confidence}`);
      // Look for existing 'Before School' period
      const beforeSchoolPeriod = mockPeriods.find(p => 
        p.name.toLowerCase().includes('before school')
      );
      
      if (beforeSchoolPeriod) {
        console.log(`Found existing Before School period: ${beforeSchoolPeriod.name}`);
        result.periodId = beforeSchoolPeriod.id;
        result.confidence = pattern.confidence;
        return result;
      } else {
        // This is a new period
        console.log(`Creating new Before School period with confidence ${pattern.confidence}`);
        result.isNewPeriod = true;
        result.periodName = 'Before School';
        result.confidence = pattern.confidence;
        return result;
      }
    }
  }
  
  const afterSchoolPatterns = [
    { regex: /\b(after|following)\s+school\b/i, confidence: 0.75 },
    { regex: /\bend\s+of\s+(the\s+)?day\b/i, confidence: 0.7 },
    { regex: /\bafter\s+classes\b/i, confidence: 0.75 },
    { regex: /\bwhen\s+school\s+(ends|is\s+over)\b/i, confidence: 0.7 },
  ];
  
  for (const pattern of afterSchoolPatterns) {
    if (lowercaseText.match(pattern.regex)) {
      console.log(`Detected after school pattern with confidence ${pattern.confidence}`);
      // Look for existing 'After School' period
      const afterSchoolPeriod = mockPeriods.find(p => 
        p.name.toLowerCase().includes('after school')
      );
      
      if (afterSchoolPeriod) {
        console.log(`Found existing After School period: ${afterSchoolPeriod.name}`);
        result.periodId = afterSchoolPeriod.id;
        result.confidence = pattern.confidence;
        return result;
      } else {
        // This is a new period
        console.log(`Creating new After School period with confidence ${pattern.confidence}`);
        result.isNewPeriod = true;
        result.periodName = 'After School';
        result.confidence = pattern.confidence;
        return result;
      }
    }
  }
  
  // Context-aware time of day detection
  // Only resort to this if no explicit period was mentioned
  const timeContextPatterns = [
    { regex: /\b(in|during)\s+the\s+morning\b/i, periodName: 'Before School', confidence: 0.45 },
    { regex: /\b(in|during)\s+the\s+afternoon\b/i, periodName: 'After School', confidence: 0.45 },
  ];
  
  for (const pattern of timeContextPatterns) {
    if (lowercaseText.match(pattern.regex)) {
      console.log(`Detected time context pattern with low confidence ${pattern.confidence}`);
      // Look for existing period
      const periodMatch = mockPeriods.find(p => 
        p.name.toLowerCase().includes(pattern.periodName.toLowerCase())
      );
      
      if (periodMatch) {
        console.log(`Found time context period match: ${periodMatch.name}`);
        result.periodId = periodMatch.id;
        result.confidence = pattern.confidence;
        return result;
      } else {
        // This is a new period
        console.log(`Creating new time context period: ${pattern.periodName}`);
        result.isNewPeriod = true;
        result.periodName = pattern.periodName;
        result.confidence = pattern.confidence;
        return result;
      }
    }
  }
  
  // No period detected - return with zero confidence
  console.log("No period detected in text");
  result.confidence = 0;
  return result;
};
