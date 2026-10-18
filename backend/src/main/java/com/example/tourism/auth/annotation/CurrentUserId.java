package com.example.tourism.auth.annotation;

import java.lang.annotation.*;

/**
 * Annotation đánh dấu tham số Controller để tự động inject ID người dùng (Long userId).
 */
@Target(ElementType.PARAMETER)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface CurrentUserId {
    boolean required() default false;
}

