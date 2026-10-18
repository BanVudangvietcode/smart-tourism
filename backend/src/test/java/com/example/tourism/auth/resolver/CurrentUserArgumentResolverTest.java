package com.example.tourism.auth.resolver;

import com.example.tourism.auth.annotation.CurrentUser;
import com.example.tourism.auth.annotation.CurrentUserId;
import com.example.tourism.auth.model.AuthUser;
import com.example.tourism.auth.util.JwtUtils;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.web.context.request.ServletWebRequest;

import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@DisplayName("CurrentUserArgumentResolver Unit Tests")
class CurrentUserArgumentResolverTest {

    private JwtUtils jwtUtils;
    private CurrentUserArgumentResolver resolver;

    // Dummy controller method for reflecting MethodParameter
    public void sampleMethod(
            @CurrentUser AuthUser optionalUser,
            @CurrentUser(required = true) AuthUser requiredUser,
            @CurrentUserId Long userIdOnly,
            String unsupportedParam
    ) {}

    @BeforeEach
    void setUp() {
        jwtUtils = mock(JwtUtils.class);
        resolver = new CurrentUserArgumentResolver(jwtUtils);
    }

    private MethodParameter getParam(int index) throws NoSuchMethodException {
        Method method = this.getClass().getMethod("sampleMethod", AuthUser.class, AuthUser.class, Long.class, String.class);
        return new MethodParameter(method, index);
    }

    @Test
    @DisplayName("supportsParameter should return true for annotated parameters and false for others")
    void testSupportsParameter() throws NoSuchMethodException {
        assertTrue(resolver.supportsParameter(getParam(0))); // @CurrentUser AuthUser
        assertTrue(resolver.supportsParameter(getParam(1))); // @CurrentUser(required = true) AuthUser
        assertTrue(resolver.supportsParameter(getParam(2))); // @CurrentUserId Long
        assertFalse(resolver.supportsParameter(getParam(3))); // String unsupportedParam
    }

    @Test
    @DisplayName("resolveArgument should read userId and role from request attributes")
    void testResolveFromAttributes() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setAttribute("userId", 42L);
        request.setAttribute("role", "ADMIN");
        ServletWebRequest webRequest = new ServletWebRequest(request);

        Object result = resolver.resolveArgument(getParam(0), null, webRequest, null);

        assertNotNull(result);
        assertTrue(result instanceof AuthUser);
        AuthUser authUser = (AuthUser) result;
        assertEquals(42L, authUser.id());
        assertEquals("ADMIN", authUser.role());
        assertTrue(authUser.isAdmin());
    }

    @Test
    @DisplayName("resolveArgument should parse Bearer token when attributes are missing")
    void testResolveFromBearerHeader() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer valid.token.here");
        ServletWebRequest webRequest = new ServletWebRequest(request);

        when(jwtUtils.validateToken("valid.token.here")).thenReturn(true);
        when(jwtUtils.getUserIdFromToken("valid.token.here")).thenReturn(101L);
        when(jwtUtils.getRoleFromToken("valid.token.here")).thenReturn("USER");

        Object result = resolver.resolveArgument(getParam(0), null, webRequest, null);

        assertNotNull(result);
        AuthUser authUser = (AuthUser) result;
        assertEquals(101L, authUser.id());
        assertEquals("USER", authUser.role());
        assertFalse(authUser.isAdmin());
    }

    @Test
    @DisplayName("resolveArgument should throw SecurityException when required=true and no user authenticated")
    void testResolveRequiredThrowsException() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        ServletWebRequest webRequest = new ServletWebRequest(request);

        assertThrows(SecurityException.class, () ->
                resolver.resolveArgument(getParam(1), null, webRequest, null)
        );
    }

    @Test
    @DisplayName("resolveArgument should return null when required=false and no user authenticated")
    void testResolveOptionalReturnsNull() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        ServletWebRequest webRequest = new ServletWebRequest(request);

        Object result = resolver.resolveArgument(getParam(0), null, webRequest, null);
        assertNull(result);
    }

    @Test
    @DisplayName("resolveArgument should return Long when parameter type is Long")
    void testResolveLongParameter() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setAttribute("userId", 88L);
        ServletWebRequest webRequest = new ServletWebRequest(request);

        Object result = resolver.resolveArgument(getParam(2), null, webRequest, null);

        assertNotNull(result);
        assertEquals(88L, result);
    }
}

