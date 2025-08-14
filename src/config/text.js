export function useTextConfig() {
    const baseConfig = {
        minFontSize: 8, // Minimum font size in px
        step: 0.1, // Search precision
    };

    const flatConfig = {
        ...baseConfig,
        baseLineHeight: 20.235,
        maxFontSize: 17.27, // Maximum font size in px
        baseFontSize: 17.27, // Base font size for ratio calculation
        paragraphSpacing: 0.545,
    };

    const dentedConfig = {
        ...baseConfig,
        baseLineHeight: 20.235,
        maxFontSize: 17.08, // Maximum font size in px
        baseFontSize: 17.08, // Base font size for ratio calculation
        paragraphSpacing: 0.55,
    }
    return {
        baseConfig,
        flatConfig,
        dentedConfig,
    }
}