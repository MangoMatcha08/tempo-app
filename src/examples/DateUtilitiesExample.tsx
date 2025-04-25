import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ValidationErrorMessages, DateValidationErrorType } from '@/utils/dateValidation';

import { useDateIntegration, useDateDebugger } from '@/hooks/useDateIntegration';
import { 
  parseStringToDate,
  formatDate, 
  convertToUtc, 
  convertToLocal, 
  ensureValidDate,
  RecurrenceType,
  datePerformance,
  validateDate,
  DateFormats,
  debugDate
} from '@/utils/dateUtils';
import { generateDateDebugReport } from '@/utils/dateDebugUtils';

const DateUtilitiesExample = () => {
  // Basic date state
  const [dateString, setDateString] = useState('2023-04-25');
  const [formattedDate, setFormattedDate] = useState('');
  const [showValidation, setShowValidation] = useState(false);
  
  // Use our integration hook
  const dateIntegration = useDateIntegration({
    initialDate: dateString,
    enablePerformanceMonitoring: true,
    validationOptions: {
      required: true,
      allowFutureDates: true,
    }
  });
  
  // Parse date initially
  useEffect(() => {
    const date = parseStringToDate(dateString);
    if (date) {
      setFormattedDate(formatDate(date, 'MMMM d, yyyy'));
    }
  }, []);
  
  // Handle date string changes
  const handleDateStringChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateString(e.target.value);
    
    const date = parseStringToDate(e.target.value);
    if (date) {
      setFormattedDate(formatDate(date, 'MMMM d, yyyy'));
      dateIntegration.setDate(date);
    } else {
      setFormattedDate('Invalid date');
    }
  };
  
  // Basic date operations
  const handleDateTest = () => {
    // Parse date
    const date = parseStringToDate(dateString);
    if (!date) {
      alert('Invalid date format');
      return;
    }
    
    // Validate date
    const validation = validateDate(date, {
      required: true,
      minDate: new Date(2020, 0, 1),
      maxDate: new Date(2030, 11, 31)
    });
    
    if (!validation.isValid) {
      alert(`Date validation failed: ${validation.errors[0]?.message || 'Unknown error'}`);
      return;
    }
    
    // Format date
    const formatted = formatDate(date, 'MMMM d, yyyy');
    setFormattedDate(formatted);
    
    // Set up recurrence (every 2 weeks)
    dateIntegration.setupRecurrence(RecurrenceType.WEEKLY, 2);
    
    // Show validation details
    setShowValidation(true);
    
    // Log debug info
    debugDate('Test Date', date);
    console.log('Debug report:', generateDateDebugReport(date));
  };
  
  // Convert between timezones
  const handleTimezoneConversion = () => {
    const date = parseStringToDate(dateString);
    if (!date) return;
    
    const utcDate = convertToUtc(date);
    const localDate = convertToLocal(utcDate);
    
    console.log('Original:', date.toString());
    console.log('UTC:', utcDate.toString());
    console.log('Back to local:', localDate.toString());
    
    alert(`Date was converted to UTC and back to local timezone.\nCheck console for details.`);
  };
  
  // Generate performance report
  const handleGenerateReport = () => {
    const report = datePerformance.generateReport();
    console.log(report);
    alert('Performance report generated. Check console for details.');
  };
  
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Date Utilities Demo</CardTitle>
          <CardDescription>
            A comprehensive example demonstrating the date utilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="basic">
            <TabsList className="mb-4">
              <TabsTrigger value="basic">Basic Operations</TabsTrigger>
              <TabsTrigger value="advanced">Advanced Features</TabsTrigger>
              <TabsTrigger value="debug">Debug Tools</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dateInput">Enter a date:</Label>
                    <Input
                      id="dateInput"
                      value={dateString}
                      onChange={handleDateStringChange}
                      placeholder="YYYY-MM-DD"
                      className="mb-2"
                    />
                    <p className="text-sm text-muted-foreground">
                      Try formats like "2023-04-25", "04/25/2023", etc.
                    </p>
                  </div>
                  
                  <div>
                    <Label>Date picker:</Label>
                    <DatePicker
                      date={dateIntegration.date}
                      setDate={(date) => {
                        if (date) {
                          dateIntegration.setDate(date);
                          setDateString(formatDate(date, DateFormats.ISO));
                          setFormattedDate(formatDate(date, 'MMMM d, yyyy'));
                        }
                      }}
                    />
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <h3 className="text-lg font-medium">Formatted Date:</h3>
                  <p className="text-2xl">{formattedDate}</p>
                </div>
                
                <div className="flex space-x-2">
                  <Button onClick={handleDateTest}>
                    Test Date Operations
                  </Button>
                  <Button variant="outline" onClick={handleTimezoneConversion}>
                    Timezone Conversion
                  </Button>
                </div>
                
                {showValidation && dateIntegration.dateValidation && (
                  <Alert variant={dateIntegration.isDateValid ? "default" : "destructive"}>
                    <AlertTitle>
                      {dateIntegration.isDateValid ? "Date is valid" : "Date is invalid"}
                    </AlertTitle>
                    <AlertDescription>
                      {dateIntegration.isDateValid 
                        ? "All validation checks passed."
                        : (
                          <ul className="list-disc pl-5">
                            {dateIntegration.dateErrors.map((err, i) => (
                              <li key={i}>{ValidationErrorMessages[err.type as DateValidationErrorType] || 'Unknown error'}</li>
                            ))}
                          </ul>
                        )
                      }
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="advanced">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Recurrence Pattern</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex space-x-2 mb-4">
                        <Button 
                          onClick={() => dateIntegration.setupRecurrence(RecurrenceType.DAILY)}
                          variant="outline"
                          size="sm"
                        >
                          Daily
                        </Button>
                        <Button 
                          onClick={() => dateIntegration.setupRecurrence(RecurrenceType.WEEKLY)}
                          variant="outline"
                          size="sm"
                        >
                          Weekly
                        </Button>
                        <Button 
                          onClick={() => dateIntegration.setupRecurrence(RecurrenceType.MONTHLY)}
                          variant="outline"
                          size="sm"
                        >
                          Monthly
                        </Button>
                      </div>
                      
                      {dateIntegration.occurrenceDates.length > 0 ? (
                        <div>
                          <h4 className="text-sm font-medium mb-2">Next occurrences:</h4>
                          <ul className="text-sm">
                            {dateIntegration.occurrenceDates.slice(0, 5).map((date, i) => (
                              <li key={i}>{formatDate(date, 'EEE, MMM d, yyyy')}</li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          Select a recurrence pattern to see occurrences
                        </p>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Performance Monitoring</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button 
                        onClick={handleGenerateReport} 
                        variant="outline"
                        className="w-full mb-2"
                      >
                        Generate Performance Report
                      </Button>
                      
                      <div className="text-sm">
                        <h4 className="font-medium mb-1">Optimization Tips:</h4>
                        <ul className="list-disc pl-5">
                          {dateIntegration.getPerformanceTips().length > 0 ? (
                            dateIntegration.getPerformanceTips().map((tip, i) => (
                              <li key={i}>{tip}</li>
                            ))
                          ) : (
                            <li>No optimization suggestions available yet</li>
                          )}
                        </ul>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">System Integration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="mb-2 block">Save to System:</Label>
                        <Input 
                          readOnly 
                          value={dateIntegration.saveDateToSystem(dateIntegration.date)}
                          className="mb-2 font-mono text-xs"
                        />
                        <p className="text-xs text-muted-foreground">
                          This is what would be saved to your database (UTC ISO string)
                        </p>
                      </div>
                      <div>
                        <Label className="mb-2 block">Load from System:</Label>
                        <div className="flex space-x-2">
                          <Input 
                            readOnly
                            value={dateIntegration.date.toISOString()}
                            className="mb-2 font-mono text-xs"
                          />
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              const loaded = dateIntegration.loadDateFromSystem(dateIntegration.date.toISOString());
                              dateIntegration.setDate(loaded);
                              setDateString(formatDate(loaded, DateFormats.ISO));
                              setFormattedDate(formatDate(loaded, 'MMMM d, yyyy'));
                            }}
                          >
                            Load
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          This simulates loading a date from your database
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="debug">
              <DateDebugView date={dateString} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

const DateDebugView = ({ date }: { date: string | Date }) => {
  const debugInfo = useDateDebugger(date);
  const [debugReport, setDebugReport] = useState('');
  
  useEffect(() => {
    // Generate report when date changes
    setDebugReport(generateDateDebugReport(date));
  }, [date]);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Date Debugging Tools</CardTitle>
        <CardDescription>View detailed information about your date</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Date Info:</h3>
              {debugInfo.isValid ? (
                <div className="text-sm">
                  <p><strong>ISO:</strong> {debugInfo.iso}</p>
                  <p><strong>Local:</strong> {debugInfo.local}</p>
                  <p><strong>UTC:</strong> {debugInfo.utc}</p>
                  <p><strong>Timestamp:</strong> {debugInfo.timestamp}</p>
                  <p><strong>Timezone:</strong> {debugInfo.timezone}</p>
                </div>
              ) : (
                <Alert variant="destructive" className="mb-2">
                  <AlertTitle>Invalid Date</AlertTitle>
                  <AlertDescription>{debugInfo.message}</AlertDescription>
                </Alert>
              )}
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Debug Report:</h3>
              <pre className="text-xs bg-muted p-2 rounded-md overflow-auto max-h-64">
                {debugReport}
              </pre>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                if (typeof date === 'string') {
                  const parsed = parseStringToDate(date);
                  if (parsed) debugDate('User date', parsed);
                } else {
                  debugDate('User date', date);
                }
              }}
            >
              Log to Console
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DateUtilitiesExample;
