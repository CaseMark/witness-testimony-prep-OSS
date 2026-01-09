'use client';

import { Sparkle, Check, ArrowRight } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

interface UpgradeCTAProps {
  className?: string;
  variant?: 'inline' | 'card' | 'full';
  onUpgrade?: () => void;
}

const features = [
  'Unlimited token usage',
  'Unlimited OCR processing',
  'Bulk document upload',
  'Advanced export options',
  'Priority support',
];

export function UpgradeCTA({
  className,
  variant = 'inline',
  onUpgrade,
}: UpgradeCTAProps) {
  if (variant === 'inline') {
    return (
      <div
        className={cn(
          'flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-4 py-3',
          className
        )}
      >
        <div className="flex items-center gap-3">
          <Sparkle weight="duotone" className="size-5 text-primary" />
          <span className="text-sm text-foreground">
            <strong>Unlock full features</strong> with a Pro subscription
          </span>
        </div>
        <Button variant="default" size="sm" onClick={onUpgrade}>
          Upgrade
          <ArrowRight data-icon="inline-end" />
        </Button>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <Card className={cn('border-primary/30 bg-primary/5', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkle weight="duotone" className="size-5 text-primary" />
            Upgrade to Pro
          </CardTitle>
          <CardDescription>
            Get unlimited access to all features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2">
            {features.slice(0, 3).map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm">
                <Check weight="bold" className="size-4 text-primary" />
                {feature}
              </li>
            ))}
          </ul>
          <Button variant="default" className="w-full" onClick={onUpgrade}>
            <Sparkle weight="duotone" data-icon="inline-start" />
            Upgrade Now
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Full variant
  return (
    <div
      className={cn(
        'rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-8',
        className
      )}
    >
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-primary/20">
          <Sparkle weight="duotone" className="size-8 text-primary" />
        </div>
        <h2 className="mb-2 text-2xl font-semibold text-foreground">
          Upgrade to Pro
        </h2>
        <p className="mb-6 text-muted-foreground">
          Unlock the full potential of Witness Testimony Prep with unlimited
          access to all features.
        </p>
        <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature}
              className="flex items-center gap-2 rounded-lg bg-card/50 px-4 py-2 text-sm"
            >
              <Check weight="bold" className="size-4 text-primary" />
              {feature}
            </div>
          ))}
        </div>
        <Button size="lg" onClick={onUpgrade}>
          <Sparkle weight="duotone" data-icon="inline-start" />
          Upgrade to Pro
          <ArrowRight data-icon="inline-end" />
        </Button>
      </div>
    </div>
  );
}
