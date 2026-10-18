package com.example.tourism.auth.dto;

import jakarta.validation.constraints.NotBlank;

public class GuestSessionRequest {
    @NotBlank(message = "deviceId không được để trống.")
    private String deviceId;
    private String os; // "ios", "android", "web"

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

    public String getOs() { return os; }
    public void setOs(String os) { this.os = os; }
}
