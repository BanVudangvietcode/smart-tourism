package com.example.tourism.common.exception;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;

import java.util.Map;
import java.util.NoSuchElementException;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("GlobalExceptionHandler Unit Tests")
class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler exceptionHandler;

    @BeforeEach
    void setUp() {
        exceptionHandler = new GlobalExceptionHandler();
    }

    @Test
    @DisplayName("Should handle MethodArgumentNotValidException with 400 and first error message")
    void handleValidationExceptions_returns400WithErrors() throws NoSuchMethodException {
        var dummyMethod = this.getClass().getDeclaredMethod("setUp");
        MethodParameter parameter = new MethodParameter(dummyMethod, -1);

        BeanPropertyBindingResult bindingResult = new BeanPropertyBindingResult(new Object(), "target");
        bindingResult.addError(new FieldError("target", "name", "Tên tour không được để trống."));
        bindingResult.addError(new FieldError("target", "stops", "Tour cần có ít nhất 1 điểm dừng."));

        MethodArgumentNotValidException ex = new MethodArgumentNotValidException(parameter, bindingResult);

        ResponseEntity<Map<String, Object>> response = exceptionHandler.handleValidationExceptions(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("Tên tour không được để trống.", response.getBody().get("error"));
        assertTrue(response.getBody().containsKey("errors"));
    }

    @Test
    @DisplayName("Should handle IllegalArgumentException with 400 Bad Request")
    void handleIllegalArgument_generic_returns400() {
        IllegalArgumentException ex = new IllegalArgumentException("Quỹ thời gian không hợp lệ");
        ResponseEntity<Map<String, Object>> response = exceptionHandler.handleIllegalArgument(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals("Quỹ thời gian không hợp lệ", response.getBody().get("error"));
    }

    @Test
    @DisplayName("Should handle IllegalArgumentException containing 'không tìm thấy' with 404 Not Found")
    void handleIllegalArgument_notFoundMessage_returns404() {
        IllegalArgumentException ex = new IllegalArgumentException("Không tìm thấy tour với ID: 999");
        ResponseEntity<Map<String, Object>> response = exceptionHandler.handleIllegalArgument(ex);

        assertEquals(HttpStatus.NOT_FOUND, response.getStatusCode());
        assertEquals("Không tìm thấy tour với ID: 999", response.getBody().get("error"));
    }

    @Test
    @DisplayName("Should handle ResourceNotFoundException and NoSuchElementException with 404 Not Found")
    void handleNotFound_returns404() {
        ResourceNotFoundException ex1 = new ResourceNotFoundException("Địa điểm không tồn tại");
        ResponseEntity<Map<String, Object>> res1 = exceptionHandler.handleNotFound(ex1);
        assertEquals(HttpStatus.NOT_FOUND, res1.getStatusCode());
        assertEquals("Địa điểm không tồn tại", res1.getBody().get("error"));

        NoSuchElementException ex2 = new NoSuchElementException("Không tìm thấy món ăn");
        ResponseEntity<Map<String, Object>> res2 = exceptionHandler.handleNotFound(ex2);
        assertEquals(HttpStatus.NOT_FOUND, res2.getStatusCode());
        assertEquals("Không tìm thấy món ăn", res2.getBody().get("error"));
    }

    @Test
    @DisplayName("Should handle SecurityException with 403 Forbidden")
    void handleSecurity_returns403() {
        SecurityException ex = new SecurityException("Tour này ở chế độ riêng tư.");
        ResponseEntity<Map<String, Object>> response = exceptionHandler.handleSecurity(ex);

        assertEquals(HttpStatus.FORBIDDEN, response.getStatusCode());
        assertEquals("Tour này ở chế độ riêng tư.", response.getBody().get("error"));
    }

    @Test
    @DisplayName("Should handle MissingServletRequestParameterException with 400 Bad Request")
    void handleMissingParam_returns400() {
        MissingServletRequestParameterException ex = new MissingServletRequestParameterException("poiId", "Long");
        ResponseEntity<Map<String, Object>> response = exceptionHandler.handleMissingParam(ex);

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertTrue(response.getBody().get("error").toString().contains("poiId"));
    }

    @Test
    @DisplayName("Should handle unexpected Exception with 500 Internal Server Error")
    void handleGenericException_returns500() {
        RuntimeException ex = new RuntimeException("Database timeout");
        ResponseEntity<Map<String, Object>> response = exceptionHandler.handleGenericException(ex);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertEquals("Database timeout", response.getBody().get("error"));
    }
}

