use dobot_studio_core::splash::SplashConfig;

#[test]
fn test_splash_window_configuration() {
    let config = SplashConfig::default();
    assert_eq!(config.width, 460);
    assert_eq!(config.height, 260);
    assert_eq!(config.duration_ms, 1200);
    assert_eq!(config.fade_in_ms, 150);
    assert_eq!(config.fade_out_ms, 200);
}

#[test]
fn test_splash_screen_centering() {
    let config = SplashConfig::default();
    let (x, y) = config.calculate_center(1920, 1080);
    assert_eq!(x, (1920 - 460) / 2);
    assert_eq!(y, (1080 - 260) / 2);
}
