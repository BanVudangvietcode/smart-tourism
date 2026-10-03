package com.example.tourism.auth.dto;

public class GuestSessionRequest {
    private String deviceId;
    private String os; // "ios", "android", "web"

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

    public String getOs() { return os; }
    public void setOs(String os) { this.os = os; }
}
