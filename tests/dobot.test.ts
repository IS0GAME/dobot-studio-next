import { expect, test, describe } from 'bun:test';
import { createPtpPacket, createSuctionCupPacket, verifyChecksum, PtpMode, CMD_PTP, CMD_END_EFFECTOR_SUCTION } from '../src/protocol/dobotProtocol';
import { DobotKinematics } from '../src/kinematics/dobotKinematics';

describe('Dobot Serial Protocol 0xAA', () => {
  test('PTP command packet generation & checksum', () => {
    const bytes = createPtpPacket(PtpMode.MOVJ_XYZ, 230.0, 0.0, -10.0, 0.0, true);
    expect(bytes[0]).toBe(0xAA);
    expect(bytes[1]).toBe(0xAA);
    expect(bytes[3]).toBe(CMD_PTP);
    expect(verifyChecksum(bytes)).toBe(true);
  });

  test('Suction Cup packet generation & checksum', () => {
    const bytes = createSuctionCupPacket(true, true, true);
    expect(bytes[0]).toBe(0xAA);
    expect(bytes[1]).toBe(0xAA);
    expect(bytes[3]).toBe(CMD_END_EFFECTOR_SUCTION);
    expect(verifyChecksum(bytes)).toBe(true);
  });
});

describe('Analytical Kinematics', () => {
  test('IK to FK roundtrip test', () => {
    const target = { x: 230.0, y: 0.0, z: -10.0, r: 0.0 };
    const joints = DobotKinematics.inverse(target);
    expect(joints).not.toBeNull();
    if (joints) {
      const calculated = DobotKinematics.forward(joints);
      expect(Math.abs(calculated.x - target.x)).toBeLessThan(1.0);
      expect(Math.abs(calculated.y - target.y)).toBeLessThan(1.0);
      expect(Math.abs(calculated.z - target.z)).toBeLessThan(1.0);
    }
  });

  test('Unreachable position boundary check', () => {
    const unreachable = { x: 500.0, y: 500.0, z: 0.0, r: 0.0 };
    expect(DobotKinematics.isReachable(unreachable)).toBe(false);
    expect(DobotKinematics.inverse(unreachable)).toBeNull();
  });
});
