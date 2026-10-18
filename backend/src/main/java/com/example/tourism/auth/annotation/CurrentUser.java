package com.example.tourism.auth.annotation;

import java.lang.annotation.*;

/**
 * Annotation đánh dấu tham số Controller để tự động inject thông tin AuthUser hoặc Long userId.
 * - required = false (mặc định): Cho phép null nếu du khách chưa đăng nhập / không gửi token.
 * - required = true: Tự động ném SecurityException (401/403) nếu không có token hợp lệ.
 */
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface CurrentUser {
    boolean required() default false;
}

