use crate::kinematics::forward::{L_END_EFFECTOR, L_FOREARM, L_REAR_ARM};
use crate::kinematics::workspace::{CartesianPose, JointPose, WorkspaceLimits};

pub struct DobotKinematics;

impl DobotKinematics {
    pub fn inverse(pose: &CartesianPose) -> Result<JointPose, &'static str> {
        let limits = WorkspaceLimits::default();
        if !limits.is_pose_valid(pose) {
            return Err("Target pose outside reachable workspace");
        }

        let j1 = pose.y.atan2(pose.x).to_degrees();

        let r_total = (pose.x * pose.x + pose.y * pose.y).sqrt();
        let r_arm = r_total - L_END_EFFECTOR;
        let z_arm = pose.z;

        let d_sq = r_arm * r_arm + z_arm * z_arm;
        let d = d_sq.sqrt();

        let l2 = L_REAR_ARM;
        let l3 = L_FOREARM;

        if d > (l2 + l3) || d < (l2 - l3).abs() {
            return Err("Target point cannot be reached by arm links");
        }

        // Angle beta from horizontal to target point
        let beta = z_arm.atan2(r_arm);

        // Law of Cosines for shoulder angle alpha
        let cos_alpha = ((l2 * l2 + d_sq - l3 * l3) / (2.0 * l2 * d)).clamp(-1.0, 1.0);
        let alpha = cos_alpha.acos();

        // Shoulder joint j2
        let j2 = (beta + alpha).to_degrees();

        // Law of Cosines for elbow angle gamma
        let cos_gamma = ((l2 * l2 + l3 * l3 - d_sq) / (2.0 * l2 * l3)).clamp(-1.0, 1.0);
        let gamma = cos_gamma.acos();

        // Forearm joint j3 relative to horizon
        let j3 = (std::f32::consts::PI - gamma - (beta + alpha)).to_degrees();

        // Wrist joint j4
        let j4 = pose.r - j1;

        let joints = JointPose { j1, j2, j3, j4 };
        if !limits.is_joint_valid(&joints) {
            return Err("Joint limits exceeded");
        }

        Ok(joints)
    }

    pub fn forward(joints: &JointPose) -> CartesianPose {
        crate::kinematics::forward::DobotFK::compute(joints)
    }
}
