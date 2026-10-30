package com.example.tourism.common.util;

public final class I18nUtils {

    private I18nUtils() {}

    /**
     * Resolve bilingual string with graceful fallback to Vietnamese.
     *
     * @param viText Vietnamese text (default/fallback)
     * @param enText English text (optional)
     * @param lang   Requested language code ("vi", "en", etc.)
     * @return English text if lang == "en" and enText is non-blank; otherwise viText
     */
    public static String resolve(String viText, String enText, String lang) {
        if ("en".equalsIgnoreCase(lang) && enText != null && !enText.isBlank()) {
            return enText;
        }
        return viText;
    }
}
