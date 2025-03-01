'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './button';

interface ErrorDisplayProps {
  error?: Error | null;
  message?: string;
  retry?: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ 
  error, 
  message, 
  retry 
}) => {
  const errorMessage = message || error?.message || 'Something went wrong';
  
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-background rounded-lg shadow-sm border border-destructive/20 text-center space-y-4 max-w-2xl mx-auto my-12">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <h2 className="text-2xl font-semibold text-foreground">Error</h2>
      <p className="text-muted-foreground">{errorMessage}</p>
      
      {retry && (
        <Button 
          onClick={retry} 
          variant="outline" 
          className="mt-4"
        >
          Try Again
        </Button>
      )}
    </div>
  );
};