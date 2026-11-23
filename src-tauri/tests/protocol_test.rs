use dobot_studio_core::protocol::codec::PacketCodec;
use dobot_studio_core::protocol::packet::{DobotPacket, PtpMode, CMD_PTP, CMD_END_EFFECTOR_SUCTION};

#[test]
fn test_dobot_packet_ptp_checksum() {
    let packet = DobotPacket::new_ptp_cmd(PtpMode::MOVJ_XYZ, 230.0, 0.0, -10.0, 0.0, true);
    let bytes = packet.to_bytes();
    assert_eq!(bytes[0], 0xAA);
    assert_eq!(bytes[1], 0xAA);
    assert!(DobotPacket::verify_checksum(&bytes));
}

#[test]
fn test_dobot_packet_suction_cup() {
    let packet = DobotPacket::new_suction_cup(true, true, true);
    let bytes = packet.to_bytes();
    assert_eq!(bytes[0], 0xAA);
    assert_eq!(bytes[1], 0xAA);
    assert_eq!(bytes[3], CMD_END_EFFECTOR_SUCTION);
    assert!(DobotPacket::verify_checksum(&bytes));
}

#[test]
fn test_codec_stream_decode() {
    let mut codec = PacketCodec::new();
    let p1 = DobotPacket::new_ptp_cmd(PtpMode::MOVL_XYZ, 200.0, 20.0, 50.0, 10.0, false);
    let p2 = DobotPacket::new_suction_cup(true, false, true);

    let mut stream = vec![0x12, 0x34]; // junk
    stream.extend_from_slice(&p1.to_bytes());
    stream.extend_from_slice(&[0x99]); // middle junk
    stream.extend_from_slice(&p2.to_bytes());

    let decoded = codec.feed(&stream);
    assert_eq!(decoded.len(), 2);
    assert_eq!(decoded[0].id, CMD_PTP);
    assert_eq!(decoded[1].id, CMD_END_EFFECTOR_SUCTION);
}
