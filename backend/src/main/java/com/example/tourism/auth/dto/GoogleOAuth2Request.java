package com.example.tourism.auth.dto;

public class GoogleOAuth2Request {
    private String idToken;

    public String getIdToken() { return idToken; }
    public void setIdToken(String idToken) { this.idToken = idToken; }
}
