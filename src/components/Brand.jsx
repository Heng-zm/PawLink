import React from 'react';
import { BrandMark } from './Icons.jsx';

export default function Brand({ compact = false }) {
  return (
    <span className={`brand-lockup ${compact ? 'compact' : ''}`}>
      <BrandMark />
      <span>PawLink</span>
    </span>
  );
}
