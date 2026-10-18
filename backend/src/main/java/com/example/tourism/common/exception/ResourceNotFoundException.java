package com.example.tourism.common.exception;

/**
 * Ngoại lệ khi không tìm thấy tài nguyên trong hệ thống (tương ứng HTTP 404 NOT FOUND).
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String resourceName, Object identifier) {
        super(String.format("Không tìm thấy %s với mã: %s", resourceName, identifier));
    }
}

