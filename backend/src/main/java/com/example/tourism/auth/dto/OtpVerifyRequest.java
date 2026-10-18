package com.example.tourism.auth.dto;

import jakarta.validation.constraints.NotBlank;

public class OtpVerifyRequest {
    @NotBlank(message = "Số điện thoại không được để trống.")
    private String phone;

    @NotBlank(message = "Mã OTP không được để trống.")
    private String otp;

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getOtp() {
        return otp;
    }

    public void setOtp(String otp) {
        this.otp = otp;
    }
}
