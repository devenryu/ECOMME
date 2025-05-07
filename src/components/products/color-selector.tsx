'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react';
import { toast } from 'sonner';

interface Color {
  id?: string;
  name: string;
  hex_code: string;
  custom?: boolean;
}

interface ColorSelectorProps {
  selectedColors: Color[];
  onChange: (colors: Color[]) => void;
}

export function ColorSelector({ selectedColors = [], onChange }: ColorSelectorProps) {
  const [standardColors, setStandardColors] = useState<Color[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [customColor, setCustomColor] = useState('');
  const [customColorName, setCustomColorName] = useState('');
  const [showCustomColorInput, setShowCustomColorInput] = useState(false);
  
  // Fetch standard colors on component mount
  useEffect(() => {
    const fetchColors = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/products/options');
        if (!response.ok) throw new Error('Failed to fetch colors');
        
        const data = await response.json();
        setStandardColors(data.colors || []);
      } catch (error) {
        console.error('Error fetching colors:', error);
        toast.error('Failed to load colors');
      } finally {
        setIsLoading(false);
      }
    };

    fetchColors();
  }, []);

  const handleSelectColor = (color: Color) => {
    if (selectedColors.some(c => c.id === color.id)) {
      onChange(selectedColors.filter(c => c.id !== color.id));
    } else {
      onChange([...selectedColors, color]);
    }
  };

  const handleRemoveColor = (index: number) => {
    const newColors = [...selectedColors];
    newColors.splice(index, 1);
    onChange(newColors);
  };

  const handleAddCustomColor = () => {
    if (!customColor.match(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)) {
      toast.error('Please enter a valid hex color (e.g., #FF0000)');
      return;
    }

    if (!customColorName.trim()) {
      toast.error('Please enter a name for your custom color');
      return;
    }

    const newCustomColor: Color = {
      id: `custom-${Date.now()}`,
      name: customColorName.trim(),
      hex_code: customColor,
      custom: true
    };

    onChange([...selectedColors, newCustomColor]);
    setCustomColor('');
    setCustomColorName('');
    setShowCustomColorInput(false);
  };

  return (
    <div className="space-y-4">
      <Label>Colors</Label>
      
      <div className="flex flex-wrap gap-2">
        {selectedColors.map((color, index) => (
          <div 
            key={color.id || index} 
            className="flex items-center gap-2 border rounded-md px-3 py-2 bg-background"
          >
            <div 
              className="w-5 h-5 rounded-full border" 
              style={{ backgroundColor: color.hex_code }}
              aria-label={color.name}
            />
            <span>{color.name}</span>
            <button
              type="button" 
              className="text-muted-foreground hover:text-foreground" 
              onClick={() => handleRemoveColor(index)}
              aria-label={`Remove ${color.name} color`}
              tabIndex={0}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}

        <Popover>
          <PopoverTrigger asChild>
            <Button 
              type="button" 
              variant="outline" 
              className="gap-1" 
              disabled={isLoading}
            >
              <Plus className="h-4 w-4" />
              Add Color
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-4">
            <div className="space-y-4">
              <h3 className="font-medium">Standard Colors</h3>
              <div className="grid grid-cols-4 gap-2">
                {standardColors.map(color => (
                  <button
                    key={color.id}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
                      selectedColors.some(c => c.id === color.id) 
                        ? 'border-primary' 
                        : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color.hex_code }}
                    aria-label={color.name}
                    title={color.name}
                    onClick={() => handleSelectColor(color)}
                    tabIndex={0}
                  />
                ))}
              </div>

              <div className="border-t pt-4">
                <button 
                  type="button"
                  className="text-primary text-sm hover:underline"
                  onClick={() => setShowCustomColorInput(!showCustomColorInput)}
                  tabIndex={0}
                >
                  {showCustomColorInput ? 'Hide custom color' : 'Add custom color'}
                </button>
                
                {showCustomColorInput && (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <Input 
                        type="text"
                        value={customColor}
                        onChange={e => setCustomColor(e.target.value)}
                        placeholder="#FF0000"
                        className="w-full"
                        aria-label="Custom color hex code"
                      />
                      {customColor && (
                        <div 
                          className="w-8 h-8 rounded-full border"
                          style={{ backgroundColor: customColor }}
                        />
                      )}
                    </div>
                    <Input 
                      type="text"
                      value={customColorName}
                      onChange={e => setCustomColorName(e.target.value)}
                      placeholder="Color name"
                      className="w-full"
                      aria-label="Custom color name"
                    />
                    <Button 
                      type="button" 
                      onClick={handleAddCustomColor}
                      className="w-full"
                      size="sm"
                    >
                      Add Custom Color
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
} 