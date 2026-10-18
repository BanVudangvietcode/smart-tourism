package com.example.tourism.common.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.NoSuchElementException;

/**
 * Bộ xử lý ngoại lệ tập trung toàn hệ thống (Global Exception Handler).
 * Gom toàn bộ việc bắt lỗi (try-catch) từ các Controller về 1 nơi duy nhất,
 * chuẩn hóa phản hồi lỗi JSON đồng nhất và rõ ràng.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Bắt lỗi Jakarta Bean Validation (@Valid trên @RequestBody).
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        String firstErrorMessage = "Dữ liệu yêu cầu không hợp lệ.";

        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(error.getField(), error.getDefaultMessage());
            if ("Dữ liệu yêu cầu không hợp lệ.".equals(firstErrorMessage)) {
                firstErrorMessage = error.getDefaultMessage();
            }
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("error", firstErrorMessage);
        body.put("errors", fieldErrors);
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("timestamp", LocalDateTime.now());

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    /**
     * Bắt lỗi tham số nghiệp vụ hoặc logic không hợp lệ (IllegalArgumentException).
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        String msg = ex.getMessage() != null ? ex.getMessage() : "Yêu cầu không hợp lệ.";
        boolean isNotFound = msg.toLowerCase().contains("không tìm thấy") || msg.toLowerCase().contains("not found");

        HttpStatus status = isNotFound ? HttpStatus.NOT_FOUND : HttpStatus.BAD_REQUEST;

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("error", msg);
        body.put("status", status.value());
        body.put("timestamp", LocalDateTime.now());

        return ResponseEntity.status(status).body(body);
    }

    /**
     * Bắt lỗi không tìm thấy tài nguyên (ResourceNotFoundException / NoSuchElementException).
     */
    @ExceptionHandler({ResourceNotFoundException.class, NoSuchElementException.class})
    public ResponseEntity<Map<String, Object>> handleNotFound(RuntimeException ex) {
        String msg = ex.getMessage() != null ? ex.getMessage() : "Không tìm thấy tài nguyên yêu cầu.";
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("error", msg);
        body.put("status", HttpStatus.NOT_FOUND.value());
        body.put("timestamp", LocalDateTime.now());

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(body);
    }

    /**
     * Bắt lỗi quyền truy cập và bảo mật (SecurityException).
     */
    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<Map<String, Object>> handleSecurity(SecurityException ex) {
        String msg = ex.getMessage() != null ? ex.getMessage() : "Bạn không có quyền truy cập tài nguyên này.";
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("error", msg);
        body.put("status", HttpStatus.FORBIDDEN.value());
        body.put("timestamp", LocalDateTime.now());

        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
    }

    /**
     * Bắt lỗi thiếu Query Param bắt buộc.
     */
    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<Map<String, Object>> handleMissingParam(MissingServletRequestParameterException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("error", "Thiếu tham số bắt buộc: " + ex.getParameterName());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("timestamp", LocalDateTime.now());

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    /**
     * Bắt các lỗi chưa được dự đoán khác (Fallback Internal Server Error).
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(Exception ex) {
        log.error("Unhandled Exception caught by GlobalExceptionHandler: ", ex);
        String msg = ex.getMessage() != null ? ex.getMessage() : "Lỗi hệ thống máy chủ.";
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("error", msg);
        body.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        body.put("timestamp", LocalDateTime.now());

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }
}

