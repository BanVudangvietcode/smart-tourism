package com.example.tourism.auth.dto;

import jakarta.validation.constraints.NotBlank;

public class OtpRequest {
    @NotBlank(message = "Số điện thoại không được để trống.")
    private String phone;

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }
}
