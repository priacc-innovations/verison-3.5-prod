package com.example.employee_service_mama.controller;

import com.example.employee_service_mama.dto.ForgotPasswordRequest;
import com.example.employee_service_mama.dto.ResetPasswordRequest;
import com.example.employee_service_mama.model.Users;
import com.example.employee_service_mama.service.UserService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
@CrossOrigin(
        origins = {
                "https://teamhub.in",
                "http://teamhub.in",
                "http://teamhub-ALB-680655485.ap-south-1.elb.amazonaws.com",
                "http://15.206.26.130:80",

        },
        allowCredentials = "true"
)
public class UserController {

    private final UserService userService;

    @PostMapping("/signin")
    public ResponseEntity<?> signin(@RequestBody Map<String, String> map) {
        return ResponseEntity.ok(userService.signin(map.get("email"), map.get("password")));
    }

    @GetMapping("/{id}")
    public Users getUser(@PathVariable Integer id) {
        return userService.getUserById(id);
    }

    @PutMapping("/update-profile/{id}")
    public Users updateProfile(@PathVariable Integer id, @RequestBody Users data) {
        return userService.updateProfile(id, data);
    }

    @PostMapping("/upload-photo/{id}")
    public Map<String, String> uploadPhoto(
            @PathVariable Integer id,
            @RequestParam("photo") MultipartFile file
    ) {
        String url = userService.uploadPhoto(id, file);
        return Map.of("url", url);
    }

    @PostMapping("/add")
    public Users addEmployee(@RequestBody Users user) {
        return userService.addEmployee(user);
    }

    @GetMapping("/all")
    public List<Users> getAllUsers() {
        return userService.getAllUsers();
    }

    @PutMapping("/hr/update/{id}")
    public Users updateEmployeeJob(@PathVariable Integer id, @RequestBody Users data) {
        return userService.updateEmployeeJobDetails(id, data);
    }

    @PostMapping("/add-bulk")
    public List<Users> addBulk(@RequestBody List<Users> users) {
        return userService.addBulkEmployees(users);
    }

    @GetMapping("/count")
    public Map<String, Long> getUserCount() {
        long count = userService.getTotalUserCount();
        return Map.of("count", count);
    }

    @GetMapping("/present-today")
    public Map<String, Long> getPresentToday() {
        long count = userService.getPresentTodayCount();
        return Map.of("count", count);
    }

    @GetMapping("/on-leave-today")
    public Map<String, Long> getOnLeaveToday() {
        long count = userService.getOnLeaveTodayCount();
        return Map.of("count", count);
    }
    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        System.out.println("📩 Forgot password API triggered with email: " + request.getEmail());
        userService.sendResetOtp(request);
        return ResponseEntity.ok("OTP sent to registered email!");
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        userService.resetPassword(request.getEmail(),request.getOtp(), request.getNewPassword());
        return ResponseEntity.ok("Password updated successfully!");
    }
    @DeleteMapping("delete/{userId}")
    public ResponseEntity<String> deleteuser(@PathVariable Integer userId){
        userService.deleteuser(userId);
        return ResponseEntity.ok("Successfully deleted");
    }
     //for birthdays addes by venkatasagar
    @GetMapping("/birthdays/today")
    public ResponseEntity<List<Users>> getTodaysBirthdays() {
        List<Users> birthdays = userService.getTodaysBirthdays();
        return ResponseEntity.ok(birthdays);
    }

}
