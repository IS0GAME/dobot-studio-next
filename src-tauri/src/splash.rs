//! Win32 Minimalist Pop-and-Fade Splash Screen Model & Native Implementation

#[derive(Debug, Clone, PartialEq)]
pub struct SplashConfig {
    pub width: i32,
    pub height: i32,
    pub title: String,
    pub fade_in_ms: u64,
    pub duration_ms: u64,
    pub fade_out_ms: u64,
}

impl Default for SplashConfig {
    fn default() -> Self {
        Self {
            width: 460,
            height: 260,
            title: "Dobot Studio Next".to_string(),
            fade_in_ms: 150,
            duration_ms: 1200,
            fade_out_ms: 200,
        }
    }
}

impl SplashConfig {
    pub fn new(width: i32, height: i32, duration_ms: u64) -> Self {
        Self {
            width,
            height,
            title: "Dobot Studio Next".to_string(),
            fade_in_ms: 150,
            duration_ms,
            fade_out_ms: 200,
        }
    }

    pub fn calculate_center(&self, screen_w: i32, screen_h: i32) -> (i32, i32) {
        let x = (screen_w - self.width) / 2;
        let y = (screen_h - self.height) / 2;
        (x.max(0), y.max(0))
    }
}
