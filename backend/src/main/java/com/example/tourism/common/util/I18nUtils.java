package com.example.tourism.common.util;

public final class I18nUtils {

    private I18nUtils() {}

    /**
     * Resolve bilingual string.
     * When lang == "en", returns enText if present, otherwise falls back to viText.
     * For other languages ("ja", "ko", "zh", "fr") or default ("vi"), returns viText
     * so that the dynamic AI translation cache can translate accurately from the original Vietnamese text.
     *
     * @param viText Vietnamese text (default/source)
     * @param enText English text (optional manual translation)
     * @param lang   Requested language code ("vi", "en", "ja", "ko", "zh", "fr")
     * @return English text if lang == "en" and enText is non-blank; otherwise viText
     */
    public static String resolve(String viText, String enText, String lang) {
        if ("en".equalsIgnoreCase(lang) && enText != null && !enText.isBlank()) {
            return enText;
        }
        return viText;
    }
}
