import { expect, test, describe } from 'bun:test';
import { VirtualDobotSimulator } from '../src/simulator/virtualDobot';
import { Waypoint } from '../src/types/robot';

describe('Virtual Dobot Simulator', () => {
  test('Initial state and telemetry subscription', () => {
    const sim = new VirtualDobotSimulator();
    let receivedTelemetry = false;
    const unsub = sim.subscribe((data) => {
      receivedTelemetry = true;
      expect(data.coords.x).toBeGreaterThan(100);
    });

    const coords = sim.getCoords();
    expect(coords.x).toBe(230.0);
    expect(coords.y).toBe(0.0);

    unsub();
    sim.destroy();
    expect(receivedTelemetry).toBe(true);
  });

  test('Move to target with S-curve easing', async () => {
    const sim = new VirtualDobotSimulator();
    const target = { x: 200.0, y: 50.0, z: 20.0, r: 10.0 };
    const success = await sim.moveTo(target, 'MOVJ', 100);
    expect(success).toBe(true);

    const finalCoords = sim.getCoords();
    expect(Math.abs(finalCoords.x - target.x)).toBeLessThan(0.1);
    expect(Math.abs(finalCoords.y - target.y)).toBeLessThan(0.1);
    expect(Math.abs(finalCoords.z - target.z)).toBeLessThan(0.1);

    sim.destroy();
  });

  test('Execute waypoint with Tool Action (โหมดการใช้งาน)', async () => {
    const sim = new VirtualDobotSimulator();
    const wp: Waypoint = {
      id: 'wp-1',
      name: 'Pick Item',
      coords: { x: 220.0, y: -20.0, z: -10.0, r: 0.0 },
      motionStyle: 'MOVJ',
      pauseTime: 0.05,
      toolAction: { type: 'suction_cup', enabled: true },
    };

    const success = await sim.executeWaypoint(wp, 100);
    expect(success).toBe(true);
    expect(sim.getToolAction()).toEqual({ type: 'suction_cup', enabled: true });

    sim.destroy();
  });
});
