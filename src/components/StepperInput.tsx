import React from 'react';
import { Button } from '@/components/ui/button';
import { Minus, Plus } from 'lucide-react';

interface StepperInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
}

const StepperInput: React.FC<StepperInputProps> = ({ value, onChange, min = 0 }) => {
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon"
        className="touch-target h-10 w-10 rounded-lg"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
      >
        <Minus className="h-4 w-4" />
      </Button>
      <div className="flex h-10 w-14 items-center justify-center rounded-lg border bg-card text-center font-semibold text-foreground">
        {value}
      </div>
      <Button
        variant="outline"
        size="icon"
        className="touch-target h-10 w-10 rounded-lg"
        onClick={() => onChange(value + 1)}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default StepperInput;
