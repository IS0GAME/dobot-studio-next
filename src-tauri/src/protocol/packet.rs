use serde::{Deserialize, Serialize};

pub const DOBOT_HEADER_1: u8 = 0xAA;
pub const DOBOT_HEADER_2: u8 = 0xAA;

pub const CMD_DEVICE_SN: u8 = 0;
pub const CMD_DEVICE_NAME: u8 = 1;
pub const CMD_DEVICE_VERSION: u8 = 2;
pub const CMD_POSE: u8 = 10;
pub const CMD_RESET_POSE: u8 = 11;
pub const CMD_ALARM: u8 = 20;
pub const CMD_HOME_PARAMS: u8 = 30;
pub const CMD_HOME: u8 = 31;
pub const CMD_HHTTRIG_MODE: u8 = 40;
pub const CMD_HHTTRIG_OUTPUT: u8 = 41;
pub const CMD_ARM_ORIENTATION: u8 = 50;
pub const CMD_END_EFFECTOR_PARAMS: u8 = 60;
pub const CMD_END_EFFECTOR_LASER: u8 = 61;
pub const CMD_END_EFFECTOR_SUCTION: u8 = 62;
pub const CMD_END_EFFECTOR_GRIPPER: u8 = 63;
pub const CMD_JOG_JOINT_PARAMS: u8 = 70;
pub const CMD_JOG_COORDINATE_PARAMS: u8 = 71;
pub const CMD_JOG_COMMON_PARAMS: u8 = 72;
pub const CMD_JOG: u8 = 73;
pub const CMD_PTP_COORDINATE_PARAMS: u8 = 80;
pub const CMD_PTP_COMMON_PARAMS: u8 = 81;
pub const CMD_PTP_JUMP_PARAMS: u8 = 82;
pub const CMD_PTP_JUMP2_PARAMS: u8 = 83;
pub const CMD_PTP: u8 = 84;
pub const CMD_CP_PARAMS: u8 = 90;
pub const CMD_CP: u8 = 91;
pub const CMD_ARC_PARAMS: u8 = 100;
pub const CMD_ARC: u8 = 101;
pub const CMD_WAIT: u8 = 110;
pub const CMD_CP_LEP: u8 = 111;
pub const CMD_TRIG: u8 = 120;
pub const CMD_IO_MULTIPLEXING: u8 = 130;
pub const CMD_IO_DO: u8 = 131;
pub const CMD_IO_PWM: u8 = 132;
pub const CMD_IO_DI: u8 = 133;
pub const CMD_IO_ADC: u8 = 134;
pub const CMD_QUEUED_CMD_START: u8 = 240;
pub const CMD_QUEUED_CMD_STOP: u8 = 241;
pub const CMD_QUEUED_CMD_FORCE_STOP: u8 = 242;
pub const CMD_QUEUED_CMD_START_EXEC: u8 = 243;
pub const CMD_QUEUED_CMD_STOP_EXEC: u8 = 244;
pub const CMD_QUEUED_CMD_CLEAR: u8 = 245;
pub const CMD_QUEUED_CMD_CURRENT_INDEX: u8 = 246;

#[allow(non_camel_case_types)]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[repr(u8)]
pub enum PtpMode {
    JUMP_XYZ = 0,
    MOVJ_XYZ = 1,
    MOVL_XYZ = 2,
    JUMP_ANGLE = 3,
    MOVJ_ANGLE = 4,
    MOVL_ANGLE = 5,
    MOVJ_INC = 6,
    MOVL_INC = 7,
    MOVJ_XYZ_INC = 8,
    JUMP_MOVL_XYZ = 9,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct DobotPacket {
    pub id: u8,
    pub is_read: bool,
    pub is_queued: bool,
    pub payload: Vec<u8>,
}

impl DobotPacket {
    pub fn new(id: u8, is_read: bool, is_queued: bool, payload: Vec<u8>) -> Self {
        Self {
            id,
            is_read,
            is_queued,
            payload,
        }
    }

    pub fn new_ptp_cmd(
        mode: PtpMode,
        x: f32,
        y: f32,
        z: f32,
        r: f32,
        is_queued: bool,
    ) -> Self {
        let mut payload = Vec::with_capacity(17);
        payload.push(mode as u8);
        payload.extend_from_slice(&x.to_le_bytes());
        payload.extend_from_slice(&y.to_le_bytes());
        payload.extend_from_slice(&z.to_le_bytes());
        payload.extend_from_slice(&r.to_le_bytes());
        Self::new(CMD_PTP, false, is_queued, payload)
    }

    pub fn new_suction_cup(enable_ctrl: bool, suck: bool, is_queued: bool) -> Self {
        let payload = vec![
            if enable_ctrl { 1 } else { 0 },
            if suck { 1 } else { 0 },
        ];
        Self::new(CMD_END_EFFECTOR_SUCTION, false, is_queued, payload)
    }

    pub fn new_gripper(enable_ctrl: bool, grip: bool, is_queued: bool) -> Self {
        let payload = vec![
            if enable_ctrl { 1 } else { 0 },
            if grip { 1 } else { 0 },
        ];
        Self::new(CMD_END_EFFECTOR_GRIPPER, false, is_queued, payload)
    }

    pub fn to_bytes(&self) -> Vec<u8> {
        let len = (2 + self.payload.len()) as u8;
        let mut ctrl: u8 = 0;
        if self.is_read {
            ctrl |= 0x00;
        } else {
            ctrl |= 0x01;
        }
        if self.is_queued {
            ctrl |= 0x02;
        }

        let mut out = Vec::with_capacity(6 + self.payload.len());
        out.push(DOBOT_HEADER_1);
        out.push(DOBOT_HEADER_2);
        out.push(len);
        out.push(self.id);
        out.push(ctrl);
        out.extend_from_slice(&self.payload);

        let mut sum: u32 = self.id as u32 + ctrl as u32;
        for &b in &self.payload {
            sum += b as u32;
        }
        let checksum = ((256 - (sum % 256)) & 0xFF) as u8;
        out.push(checksum);
        out
    }

    pub fn verify_checksum(bytes: &[u8]) -> bool {
        if bytes.len() < 6 {
            return false;
        }
        if bytes[0] != DOBOT_HEADER_1 || bytes[1] != DOBOT_HEADER_2 {
            return false;
        }
        let len = bytes[2] as usize;
        if bytes.len() != len + 4 {
            return false;
        }
        let mut sum: u32 = 0;
        for &b in &bytes[3..] {
            sum += b as u32;
        }
        (sum & 0xFF) == 0
    }
}
