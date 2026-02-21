package com.example.employee_service_mama.controller;

import com.example.employee_service_mama.dto.WishRequest;
import com.example.employee_service_mama.service.WishService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/wishes")
@RequiredArgsConstructor
@CrossOrigin(
        origins = {
                "http://teamhub.in",
                "https://teamhub.in",
                "http://teamhub-ALB-680655485.ap-south-1.elb.amazonaws.com",
                "http://15.206.26.130:80"
        },
        allowCredentials = "true"
)
public class WishController {

    private final WishService wishService;

    @PostMapping("/send")
    public ResponseEntity<?> sendWish(@RequestBody WishRequest request) {
        wishService.sendWish(request);
        return ResponseEntity.ok("Birthday wish sent successfully 🎉");
    }

    @GetMapping("/received/{userId}")
    public ResponseEntity<?> getReceivedWishes(@PathVariable Long userId) {
        return ResponseEntity.ok(wishService.getWishesForUser(userId));
    }

}



