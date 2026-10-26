package com.example.tourism.config;

import com.example.tourism.auth.interceptor.JwtAuthInterceptor;
import com.example.tourism.auth.resolver.CurrentUserArgumentResolver;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.List;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final JwtAuthInterceptor jwtAuthInterceptor;
    private final CurrentUserArgumentResolver currentUserArgumentResolver;

    public WebMvcConfig(JwtAuthInterceptor jwtAuthInterceptor,
                        CurrentUserArgumentResolver currentUserArgumentResolver) {
        this.jwtAuthInterceptor = jwtAuthInterceptor;
        this.currentUserArgumentResolver = currentUserArgumentResolver;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOriginPatterns("http://localhost:[*]", "http://127.0.0.1:[*]", "*")
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                .allowedHeaders("*");
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(jwtAuthInterceptor)
                // Only protect the user profile endpoints
                .addPathPatterns("/api/v1/users/**");
    }

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(currentUserArgumentResolver);
    }
}
