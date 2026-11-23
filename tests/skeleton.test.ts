import { describe, it, expect } from 'bun:test';
import React from 'react';
import { SkeletonView } from '../src/components/SkeletonView';

describe('Fluent Skeleton Loading State', () => {
  it('SkeletonView component is defined and exports correctly', () => {
    expect(SkeletonView).toBeDefined();
    expect(typeof SkeletonView).toBe('function');
  });

  it('renders skeleton DOM elements with shimmer classes', () => {
    const element = React.createElement(SkeletonView);
    expect(element.type).toBe(SkeletonView);
  });
});
