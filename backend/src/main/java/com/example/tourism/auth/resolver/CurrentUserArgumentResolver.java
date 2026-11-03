package com.example.tourism.auth.resolver;

import com.example.tourism.auth.annotation.CurrentUser;
import com.example.tourism.auth.annotation.CurrentUserId;
import com.example.tourism.auth.model.AuthUser;
import com.example.tourism.auth.util.JwtUtils;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.MethodParameter;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

/**
 * Spring MVC Argument Resolver tự động giải quyết tham số @CurrentUser AuthUser hoặc @CurrentUserId Long
 * từ HttpServletRequest attributes (do JwtAuthInterceptor set) hoặc tự parse Authorization Bearer header.
 */
@Component
public class CurrentUserArgumentResolver implements HandlerMethodArgumentResolver {

    private final JwtUtils jwtUtils;

    public CurrentUserArgumentResolver(JwtUtils jwtUtils) {
        this.jwtUtils = jwtUtils;
    }

    @Override
    public boolean supportsParameter(MethodParameter parameter) {
        return parameter.hasParameterAnnotation(CurrentUser.class)
                || parameter.hasParameterAnnotation(CurrentUserId.class)
                || AuthUser.class.isAssignableFrom(parameter.getParameterType());
    }

    @Override
    public Object resolveArgument(MethodParameter parameter,
                                  ModelAndViewContainer mavContainer,
                                  NativeWebRequest webRequest,
                                  WebDataBinderFactory binderFactory) {
        HttpServletRequest request = (HttpServletRequest) webRequest.getNativeRequest();
        if (request == null) {
            return null;
        }

        Long userId = null;
        String role = null;

        // 1. Kiểm tra attributes do JwtAuthInterceptor thiết lập trước đó
        Object attrUserId = request.getAttribute("userId");
        if (attrUserId instanceof Long l) {
            userId = l;
            Object attrRole = request.getAttribute("role");
            if (attrRole instanceof String s) {
                role = s;
            }
        }

        // 2. Nếu attribute chưa có (endpoint công khai nhưng du khách có gửi Bearer token)
        if (userId == null) {
            String authHeader = request.getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                if (jwtUtils.validateToken(token)) {
                    userId = jwtUtils.getUserIdFromToken(token);
                    role = jwtUtils.getRoleFromToken(token);
                }
            }
        }

        // 3. Người chưa đăng nhập không được tự động cấp quyền
        if (userId == null) {
            CurrentUser currentUser =
                    parameter.getParameterAnnotation(CurrentUser.class);
        
            CurrentUserId currentUserId =
                    parameter.getParameterAnnotation(CurrentUserId.class);
        
            boolean required =
                    (currentUser != null && currentUser.required())
                    || (currentUserId != null && currentUserId.required());
        
            if (required) {
                throw new SecurityException(
                    "Bạn cần đăng nhập để thực hiện chức năng này."
                );
            }
        
            return null;
        }

        // 4. Trả về đúng kiểu dữ liệu của tham số hàm
        if (Long.class.equals(parameter.getParameterType())) {
            return userId;
        }

        return new AuthUser(userId, role);
    }
}

