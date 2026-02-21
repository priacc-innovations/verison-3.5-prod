package com.example.employee_service_mama.util;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtFilter extends OncePerRequestFilter {

    @Autowired
    JwtUtil jwtutil;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String headerreq=request.getHeader("Authorization");
        if(headerreq !=null && headerreq.startsWith("Bearer ")){
            String token=headerreq.substring(7);
if(jwtutil.validateToken(token)){
    String email=jwtutil. extractEmail(token);
    var auth1=new UsernamePasswordAuthenticationToken(email,null, List.of());
    SecurityContextHolder.getContext().setAuthentication(auth1);
}
        }
        filterChain.doFilter(request,response);
    }
}
