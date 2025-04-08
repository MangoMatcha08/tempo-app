
import React from 'react';
import { FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Info } from 'lucide-react';
import { Control } from 'react-hook-form';
import { ExtendedNotificationSettings } from './types';

interface NotificationTogglesProps {
  control: Control<ExtendedNotificationSettings>;
  // Use a union of specific string literals instead of template type
  name: "enabled" | "email.enabled" | "push.enabled" | "inApp.enabled" | "email.dailySummary.enabled";
  title: string;
  description: string;
  disabledWhen?: boolean;
  warningWhenDisabled?: string;
  infoText?: string;
}

const NotificationToggles = ({
  control,
  name,
  title,
  description,
  disabledWhen = false,
  warningWhenDisabled,
  infoText
}: NotificationTogglesProps) => {
  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name={name}
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">{title}</FormLabel>
              <FormDescription>{description}</FormDescription>
            </div>
            <FormControl>
              <Switch
                checked={typeof field.value === 'boolean' ? field.value : false}
                onCheckedChange={field.onChange}
                disabled={disabledWhen}
              />
            </FormControl>
          </FormItem>
        )}
      />

      {disabledWhen && warningWhenDisabled && (
        <Alert variant="default" className="bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900 dark:border-yellow-800 dark:text-yellow-300">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{warningWhenDisabled}</AlertDescription>
        </Alert>
      )}

      {infoText && (
        <Alert variant="default" className="bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-300">
          <Info className="h-4 w-4" />
          <AlertDescription>{infoText}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default NotificationToggles;
