use crate::protocol::packet::{DobotPacket, DOBOT_HEADER_1, DOBOT_HEADER_2};

#[derive(Debug, Default)]
pub struct PacketCodec {
    buffer: Vec<u8>,
}

impl PacketCodec {
    pub fn new() -> Self {
        Self {
            buffer: Vec::with_capacity(512),
        }
    }

    pub fn feed(&mut self, data: &[u8]) -> Vec<DobotPacket> {
        self.buffer.extend_from_slice(data);
        let mut packets = Vec::new();

        loop {
            if self.buffer.len() < 2 {
                break;
            }

            // Find 0xAA 0xAA header
            let mut header_pos = None;
            for i in 0..self.buffer.len() - 1 {
                if self.buffer[i] == DOBOT_HEADER_1 && self.buffer[i + 1] == DOBOT_HEADER_2 {
                    header_pos = Some(i);
                    break;
                }
            }

            match header_pos {
                Some(pos) => {
                    if pos > 0 {
                        self.buffer.drain(0..pos);
                    }
                    if self.buffer.len() < 4 {
                        break;
                    }
                    let len = self.buffer[2] as usize;
                    let full_pkt_len = len + 4; // header(2) + len(1) + payload(len) + checksum(1)
                    if self.buffer.len() < full_pkt_len {
                        break;
                    }

                    let raw_packet = self.buffer.drain(0..full_pkt_len).collect::<Vec<u8>>();
                    if DobotPacket::verify_checksum(&raw_packet) {
                        let id = raw_packet[3];
                        let ctrl = raw_packet[4];
                        let is_read = (ctrl & 0x01) == 0;
                        let is_queued = (ctrl & 0x02) != 0;
                        let payload_len = len - 2;
                        let payload = raw_packet[5..5 + payload_len].to_vec();
                        packets.push(DobotPacket::new(id, is_read, is_queued, payload));
                    }
                }
                None => {
                    let last = *self.buffer.last().unwrap();
                    self.buffer.clear();
                    if last == DOBOT_HEADER_1 {
                        self.buffer.push(DOBOT_HEADER_1);
                    }
                    break;
                }
            }
        }
        packets
    }
}
