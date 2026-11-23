import { expect, test, describe } from 'bun:test';
import { DobotStorage, DobotProject } from '../src/storage/dobotStorage';
import { Waypoint } from '../src/types/robot';

describe('Dobot Storage & Interoperability', () => {
  const sampleWaypoints: Waypoint[] = [
    {
      id: 'wp-1',
      name: 'P1',
      coords: { x: 230.0, y: 0.0, z: -10.0, r: 0.0 },
      motionStyle: 'MOVJ',
      pauseTime: 0.5,
      toolAction: { type: 'suction_cup', enabled: true },
    },
    {
      id: 'wp-2',
      name: 'P2',
      coords: { x: 230.0, y: 50.0, z: 20.0, r: 10.0 },
      motionStyle: 'MOVL',
      pauseTime: 0.0,
      toolAction: { type: 'suction_cup', enabled: false },
    },
  ];

  test('Export to Dobot Studio 1.9.4 legacy XML and re-import', () => {
    const xml = DobotStorage.exportToLegacyPlaybackXml(sampleWaypoints);
    expect(xml).toContain('<row_StudioVersion><item_0>Ver-170</item_0></row_StudioVersion>');
    expect(xml).toContain('<row0>');
    expect(xml).toContain('<item_1>P1</item_1>');
    expect(xml).toContain('<item_12>1</item_12>'); // Suction On

    const imported = DobotStorage.importFromLegacyPlaybackXml(xml);
    expect(imported.length).toBe(2);
    expect(imported[0].name).toBe('P1');
    expect(imported[0].coords.x).toBe(230.0);
    expect(imported[0].motionStyle).toBe('MOVJ');
    expect(imported[0].toolAction).toEqual({ type: 'suction_cup', enabled: true });

    expect(imported[1].name).toBe('P2');
    expect(imported[1].coords.y).toBe(50.0);
    expect(imported[1].motionStyle).toBe('MOVL');
  });

  test('Import original Dobot Studio 1.9.4 file content', () => {
    const originalXml = '<root><row_StudioVersion><item_0>Ver-170</item_0></row_StudioVersion><row0><item_0>1</item_0><item_1>P1</item_1><item_2>230.0</item_2><item_3>0.0</item_3><item_4>-10.0</item_4><item_5>0.0</item_5><item_10>0.0</item_10><item_12>0</item_12></row0><row1><item_0>1</item_0><item_1>P2</item_1><item_2>230.0</item_2><item_3>0.0</item_3><item_4>10.0</item_4><item_5>0.0</item_5><item_10>0.0</item_10><item_12>0</item_12></row1></root>';
    const points = DobotStorage.importFromLegacyPlaybackXml(originalXml);
    expect(points.length).toBe(2);
    expect(points[0].name).toBe('P1');
    expect(points[0].coords.z).toBe(-10.0);
    expect(points[1].name).toBe('P2');
    expect(points[1].coords.z).toBe(10.0);
  });

  test('Export to Python script format', () => {
    const py = DobotStorage.exportToPython(sampleWaypoints);
    expect(py).toContain('import DobotDllType as dType');
    expect(py).toContain('dType.SetPTPCmd(api, dType.PTPMode.PTPMOVJXYZMode, 230.00, 0.00, -10.00, 0.00, isQueued=1)');
    expect(py).toContain('dType.SetEndEffectorSuctionCup(api, 1, 1, isQueued=1)');
  });
});
