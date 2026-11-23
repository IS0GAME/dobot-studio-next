use dobot_studio_core::kinematics::inverse::DobotKinematics;
use dobot_studio_core::kinematics::workspace::{CartesianPose, WorkspaceLimits};

#[test]
fn test_dobot_ik_fk_roundtrip() {
    let target = CartesianPose {
        x: 230.0,
        y: 0.0,
        z: -10.0,
        r: 0.0,
    };
    let joints = DobotKinematics::inverse(&target).expect("Must solve IK");
    let calculated = DobotKinematics::forward(&joints);

    assert!((calculated.x - target.x).abs() < 1.0, "X difference too large: {} vs {}", calculated.x, target.x);
    assert!((calculated.y - target.y).abs() < 1.0, "Y difference too large: {} vs {}", calculated.y, target.y);
    assert!((calculated.z - target.z).abs() < 1.0, "Z difference too large: {} vs {}", calculated.z, target.z);
}

#[test]
fn test_workspace_boundary_rejection() {
    let limits = WorkspaceLimits::default();
    let unreachable_pose = CartesianPose {
        x: 500.0,
        y: 500.0,
        z: 0.0,
        r: 0.0,
    };
    assert!(!limits.is_pose_valid(&unreachable_pose));
    assert!(DobotKinematics::inverse(&unreachable_pose).is_err());
}
