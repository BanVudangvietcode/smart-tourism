package com.example.tourism.auth.dto;

import jakarta.validation.constraints.NotBlank;

public class GoogleOAuth2Request {
    @NotBlank(message = "idToken không được để trống.")
    private String idToken;
    private String deviceId;

    public String getIdToken() { return idToken; }
    public void setIdToken(String idToken) { this.idToken = idToken; }

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }
}
