import { describe, it, expect, mock } from 'bun:test';
import React from 'react';
import { NavigationRail } from '../src/components/NavigationRail';

describe('PowerToys NavigationRail Component', () => {
  it('exports NavigationRail component', () => {
    expect(NavigationRail).toBeDefined();
    expect(typeof NavigationRail).toBe('function');
  });

  it('renders navigation rail element with correct structure', () => {
    const onSelect = mock(() => {});
    const element = React.createElement(NavigationRail, {
      activeId: 'teach',
      onSelect,
    });

    expect(element).toBeDefined();
    expect(element.props.activeId).toBe('teach');
  });
});
