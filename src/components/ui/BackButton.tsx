'use client';

import React from 'react';
import { Button } from './button';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  label?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({ 
  label = 'Back' 
}) => {
  return (
    <Button
      variant="ghost"
      onClick={() => window.history.back()}
      className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  );
};