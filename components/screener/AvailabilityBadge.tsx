import React from 'react';
import { Badge } from '@/components/ui';
import type { Availability, DataMode } from '@/types';

export const AvailabilityBadge: React.FC<{ availability: Availability; mode: DataMode; size?: 'sm' | 'md' }> = ({ availability, mode, size = 'sm' }) => {
  if (availability === 'placeholder') return <Badge label="Coming soon" variant="default" size={size} />;
  if (availability === 'eod-approx') return <Badge label="EOD approx" variant="warning" size={size} />;
  return <Badge label={mode === 'EOD' ? 'EOD' : `EOD · ${mode} later`} variant="success" size={size} />;
};
