'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

type TemplateType = 'minimal' | 'standard' | 'premium';

interface TemplateSelectorProps {
  value: TemplateType;
  onChange: (value: TemplateType) => void;
}

const templates = [
  {
    id: 'minimal' as const,
    name: 'Minimal',
    description: 'Clean and simple design focusing on your product.',
    image: '/templates/minimal.png',
  },
  {
    id: 'standard' as const,
    name: 'Standard',
    description: 'Classic layout with product details and features.',
    image: '/templates/standard.png',
  },
  {
    id: 'premium' as const,
    name: 'Premium',
    description: 'Rich design with hero section and testimonials.',
    image: '/templates/premium.png',
  },
];

export function TemplateSelector({ value, onChange }: TemplateSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {templates.map((template) => (
        <div
          key={template.id}
          className={cn(
            'relative rounded-lg border-2 p-4 cursor-pointer transition-colors hover:border-primary',
            value === template.id ? 'border-primary bg-primary/5' : 'border-muted'
          )}
          onClick={() => onChange(template.id)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onChange(template.id);
            }
          }}
          tabIndex={0}
          role="radio"
          aria-checked={value === template.id}
        >
          <div className="aspect-video relative rounded-md overflow-hidden mb-4">
            <Image
              src={template.image}
              alt={`${template.name} template preview`}
              fill
              className="object-cover"
            />
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">{template.name}</h3>
            <p className="text-sm text-muted-foreground">
              {template.description}
            </p>
          </div>
          <div
            className={cn(
              'absolute inset-0 rounded-lg border-2 pointer-events-none transition-opacity',
              value === template.id
                ? 'border-primary opacity-100'
                : 'border-transparent opacity-0'
            )}
            aria-hidden="true"
          />
        </div>
      ))}
    </div>
  );
} 