use crate::kinematics::workspace::{CartesianPose, JointPose};

pub const L_BASE: f32 = 138.0;
pub const L_REAR_ARM: f32 = 135.0;
pub const L_FOREARM: f32 = 147.0;
pub const L_END_EFFECTOR: f32 = 60.0;

pub struct DobotFK;

impl DobotFK {
    pub fn compute(joints: &JointPose) -> CartesianPose {
        let j1_rad = joints.j1.to_radians();
        let j2_rad = joints.j2.to_radians();
        let j3_rad = joints.j3.to_radians();

        // Dobot parallel linkage keeps forearm angle relative to base horizon
        let r_arm = L_REAR_ARM * j2_rad.cos() + L_FOREARM * j3_rad.cos() + L_END_EFFECTOR;
        let z_arm = L_BASE + L_REAR_ARM * j2_rad.sin() - L_FOREARM * j3_rad.sin();

        let x = r_arm * j1_rad.cos();
        let y = r_arm * j1_rad.sin();
        let z = z_arm - L_BASE; // Standard Dobot coordinates where z=0 is approx work surface
        let r = joints.j1 + joints.j4;

        CartesianPose { x, y, z, r }
    }
}
