import { describe, it, expect } from 'bun:test';
import { JogPanel } from '../src/components/JogPanel';
import { WaypointList } from '../src/components/WaypointList';

describe('PowerToys Fluent UI Components', () => {
  it('exports JogPanel component with expected interface', () => {
    expect(JogPanel).toBeDefined();
    expect(typeof JogPanel).toBe('function');
  });

  it('exports WaypointList component with expected interface', () => {
    expect(WaypointList).toBeDefined();
    expect(typeof WaypointList).toBe('function');
  });
});
