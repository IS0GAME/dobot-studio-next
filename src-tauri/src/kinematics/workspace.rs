use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct CartesianPose {
    pub x: f32,
    pub y: f32,
    pub z: f32,
    pub r: f32,
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct JointPose {
    pub j1: f32,
    pub j2: f32,
    pub j3: f32,
    pub j4: f32,
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
pub struct WorkspaceLimits {
    pub min_radius: f32,
    pub max_radius: f32,
    pub min_z: f32,
    pub max_z: f32,
    pub min_j1: f32,
    pub max_j1: f32,
    pub min_j2: f32,
    pub max_j2: f32,
    pub min_j3: f32,
    pub max_j3: f32,
}

impl Default for WorkspaceLimits {
    fn default() -> Self {
        Self {
            min_radius: 140.0,
            max_radius: 330.0,
            min_z: -60.0,
            max_z: 160.0,
            min_j1: -90.0,
            max_j1: 90.0,
            min_j2: 0.0,
            max_j2: 85.0,
            min_j3: -10.0,
            max_j3: 90.0,
        }
    }
}

impl WorkspaceLimits {
    pub fn is_pose_valid(&self, pose: &CartesianPose) -> bool {
        let r = (pose.x * pose.x + pose.y * pose.y).sqrt();
        if r < self.min_radius || r > self.max_radius {
            return false;
        }
        if pose.z < self.min_z || pose.z > self.max_z {
            return false;
        }
        true
    }

    pub fn is_joint_valid(&self, joints: &JointPose) -> bool {
        joints.j1 >= self.min_j1 && joints.j1 <= self.max_j1 &&
        joints.j2 >= self.min_j2 && joints.j2 <= self.max_j2 &&
        joints.j3 >= self.min_j3 && joints.j3 <= self.max_j3
    }
}
