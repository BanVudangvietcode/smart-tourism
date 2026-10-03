package com.example.tourism.auth.dto;

public class GoogleOAuth2Request {
    private String idToken;
    private String deviceId;

    public String getIdToken() { return idToken; }
    public void setIdToken(String idToken) { this.idToken = idToken; }

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }
}
