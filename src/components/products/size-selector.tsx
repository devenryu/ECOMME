'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface SizeCategory {
  id: string;
  name: string;
  description: string;
}

interface Size {
  id: string;
  value: string;
  display_order: number;
}

interface SizeSelectorProps {
  selectedSizes: string[];
  sizeCategoryId: string | undefined;
  onSizeCategoryChange: (categoryId: string) => void;
  onSizesChange: (sizes: string[]) => void;
}

export function SizeSelector({ 
  selectedSizes = [], 
  sizeCategoryId, 
  onSizeCategoryChange, 
  onSizesChange 
}: SizeSelectorProps) {
  const [sizeCategories, setSizeCategories] = useState<SizeCategory[]>([]);
  const [standardSizes, setStandardSizes] = useState<Size[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [customSize, setCustomSize] = useState('');
  
  // Fetch size categories on component mount
  useEffect(() => {
    const fetchSizeCategories = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/products/options');
        if (!response.ok) throw new Error('Failed to fetch data');
        
        const data = await response.json();
        setSizeCategories(data.sizeCategories || []);
      } catch (error) {
        console.error('Error fetching size categories:', error);
        toast.error('Failed to load size categories');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSizeCategories();
  }, []);

  // Fetch standard sizes when size category changes
  useEffect(() => {
    if (!sizeCategoryId) return;

    const fetchSizes = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/products/options?size_category_id=${sizeCategoryId}`);
        if (!response.ok) throw new Error('Failed to fetch sizes');
        
        const data = await response.json();
        setStandardSizes(data.sizes || []);
      } catch (error) {
        console.error('Error fetching sizes:', error);
        toast.error('Failed to load sizes');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSizes();
  }, [sizeCategoryId]);

  const handleAddStandardSize = (sizeValue: string) => {
    if (selectedSizes.includes(sizeValue)) {
      toast.info('This size is already added');
      return;
    }
    onSizesChange([...selectedSizes, sizeValue]);
  };

  const handleAddCustomSize = () => {
    if (!customSize.trim()) return;
    
    if (selectedSizes.includes(customSize.trim())) {
      toast.info('This size is already added');
      return;
    }
    
    onSizesChange([...selectedSizes, customSize.trim()]);
    setCustomSize('');
  };

  const handleRemoveSize = (sizeToRemove: string) => {
    onSizesChange(selectedSizes.filter(size => size !== sizeToRemove));
  };

  const handleSizeCategoryChange = (value: string) => {
    // Clear selected sizes when changing category
    onSizesChange([]);
    onSizeCategoryChange(value);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="size-category">Size Category</Label>
        <Select 
          value={sizeCategoryId} 
          onValueChange={handleSizeCategoryChange}
          disabled={isLoading}
        >
          <SelectTrigger id="size-category">
            <SelectValue placeholder="Select size category" />
          </SelectTrigger>
          <SelectContent>
            {sizeCategories.map(category => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {sizeCategoryId && (
        <div className="space-y-4">
          <div>
            <Label>Available Sizes</Label>
            <div className="grid grid-cols-5 gap-2 mt-2">
              {standardSizes.map(size => (
                <Button
                  key={size.id}
                  type="button"
                  variant="outline"
                  className={selectedSizes.includes(size.value) ? 'bg-primary/10 border-primary' : ''}
                  onClick={() => handleAddStandardSize(size.value)}
                  disabled={isLoading}
                >
                  {size.value}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Label htmlFor="custom-size">Custom Size</Label>
              <input
                id="custom-size"
                type="text"
                className="border rounded px-3 py-2 w-full mt-2"
                placeholder="Add custom size"
                value={customSize}
                onChange={e => setCustomSize(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomSize();
                  }
                }}
                aria-label="Add custom size"
              />
            </div>
            <Button 
              type="button" 
              onClick={handleAddCustomSize}
              disabled={!customSize.trim() || isLoading}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>

          <div>
            <Label>Selected Sizes</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedSizes.map(size => (
                <div 
                  key={size} 
                  className="flex items-center gap-2 border rounded-md px-3 py-2 bg-background"
                >
                  <span>{size}</span>
                  <button
                    type="button" 
                    className="text-muted-foreground hover:text-foreground" 
                    onClick={() => handleRemoveSize(size)}
                    aria-label={`Remove ${size} size`}
                    tabIndex={0}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {selectedSizes.length === 0 && (
                <div className="text-muted-foreground text-sm">No sizes selected</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 