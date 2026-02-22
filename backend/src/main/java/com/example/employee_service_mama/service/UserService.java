package com.example.employee_service_mama.service;

import com.example.employee_service_mama.dto.ForgotPasswordRequest;
import com.example.employee_service_mama.model.Users;
import com.example.employee_service_mama.repository.*;
import com.example.employee_service_mama.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class UserService {

    private final PasswordEncoder passwordEncoder;
    private final UserRepository userRepository;
    private final AttendanceRepository attendanceRepository;
    private final LeaveRequestsRepository leaveRequestsRepository;
    private final AttendanceRecordsRepository recordsRepo;
    private final EmailService emailService;
    private final S3Client s3;
    private final JwtUtil jwtUtil;

    private static final String BUCKET = "teamhub-storage-new";
    private static final String S3_BASE_URL =
            "https://teamhub-storage-new.s3.ap-south-1.amazonaws.com/";

    /* ================= LOGIN ================= */
    public Map<String, Object> signin(String email, String rawPassword) {

        Users user = userRepository.findByEmailOnly(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(rawPassword, user.getPassword())) {
            throw new RuntimeException("Invalid password");
        }

        String token = jwtUtil.generateToken(email);

        user.setPassword(null);
        user.setResetOtp(null);
        user.setResetOtpExpiry(null);

        return Map.of("token", token, "user", user);
    }

    /* ================= GET USER ================= */
    public Users getUserById(Integer id) {
        Users user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        attachPublicPhotoUrl(user);
        return user;
    }

    /* ================= UPDATE PROFILE ================= */
    public Users updateProfile(Integer id, Users data) {

        Users user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setFullName(data.getFullName());
        user.setEmail(data.getEmail());
        user.setPhone(data.getPhone());
        user.setDob(data.getDob());
        user.setAddress1(data.getAddress1());
        user.setAddress2(data.getAddress2());
        user.setCity(data.getCity());
        user.setState(data.getState());
        user.setCountry(data.getCountry());
        user.setPincode(data.getPincode());

        return userRepository.save(user);
    }

    /* ================= FIXED UPLOAD PHOTO ================= */
    public String uploadPhoto(Integer id, MultipartFile file) {

        try {

            if (file == null || file.isEmpty()) {
                throw new RuntimeException("File is empty");
            }

            Users user = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            String originalFilename = file.getOriginalFilename();
            String extension = ".jpg";

            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }

            String key = "profile-pics/" + id + "-" + System.currentTimeMillis() + extension;

            PutObjectRequest putObjectRequest = PutObjectRequest.builder()
                    .bucket(BUCKET)
                    .key(key)
                    .contentType(file.getContentType())
                    .build();

            s3.putObject(
                    putObjectRequest,
                    software.amazon.awssdk.core.sync.RequestBody.fromBytes(file.getBytes())
            );

            // delete old image
            if (user.getPhotoUrl() != null && !user.getPhotoUrl().isBlank()) {
                try {
                    s3.deleteObject(builder -> builder
                            .bucket(BUCKET)
                            .key(user.getPhotoUrl())
                    );
                } catch (Exception ignored) {}
            }

            user.setPhotoUrl(key);
            userRepository.save(user);

            return S3_BASE_URL + key;

        } catch (Exception e) {
            throw new RuntimeException("Photo upload failed: " + e.getMessage());
        }
    }

    /* ================= LIST USERS ================= */
    public List<Users> getAllUsers() {
        List<Users> users = userRepository.findAll();
        users.forEach(this::attachPublicPhotoUrl);
        return users;
    }

    public Users addEmployee(Users data) {
        data.setPassword(passwordEncoder.encode(data.getPassword()));
        return userRepository.save(data);
    }

    /* ================= BULK ADD ================= */
    public List<Users> addBulkEmployees(List<Users> users) {

        List<Users> validUsers = new ArrayList<>();

        for (Users u : users) {
            if (u.getEmail() == null || u.getEmpid() == null ||
                    u.getFullName() == null || u.getPassword() == null) continue;

            if (userRepository.findByEmailOnly(u.getEmail()).isEmpty()
                    && userRepository.findByEmpid(u.getEmpid()).isEmpty()) {

                u.setPassword(passwordEncoder.encode(u.getPassword()));
                validUsers.add(u);
            }
        }

        return validUsers.isEmpty() ? List.of() : userRepository.saveAll(validUsers);
    }

    /* ================= HR UPDATE ================= */
    public Users updateEmployeeJobDetails(Integer id, Users data) {

        Users user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (data.getFullName() != null) user.setFullName(data.getFullName());
        if (data.getEmail() != null) user.setEmail(data.getEmail());
        if (data.getEmpid() != null) user.setEmpid(data.getEmpid());
        if (data.getDesignation() != null) user.setDesignation(data.getDesignation());
        if (data.getDomain() != null) user.setDomain(data.getDomain());
        if (data.getBaseSalary() != null) user.setBaseSalary(data.getBaseSalary());

        return userRepository.save(user);
    }

    /* ================= COUNTS ================= */
    public long getTotalUserCount() {
        return userRepository.count();
    }

    public long getOnLeaveTodayCount() {
        return leaveRequestsRepository.countLeaveToday(LocalDate.now());
    }

    public long getPresentTodayCount() {
        String today = LocalDate.now()
                .format(java.time.format.DateTimeFormatter.ofPattern("MM/dd/yyyy"));
        return recordsRepo.countPresentToday(today);
    }

    /* ================= BIRTHDAYS ================= */
    public List<Users> getTodaysBirthdays() {

        LocalDate today = LocalDate.now();
        List<Users> result = new ArrayList<>();

        for (Users user : userRepository.findAll()) {
            LocalDate dob = parseDateOfBirth(user.getDob());

            if (dob != null &&
                    dob.getMonthValue() == today.getMonthValue() &&
                    dob.getDayOfMonth() == today.getDayOfMonth()) {

                attachPublicPhotoUrl(user);
                result.add(user);
            }
        }
        return result;
    }

    /* ================= PASSWORD RESET ================= */
    public void sendResetOtp(ForgotPasswordRequest request) {

        Users user = userRepository.findByEmailOnly(request.getEmail())
                .orElseThrow(() -> new RuntimeException("No user found"));

        String otp = String.format("%06d", new Random().nextInt(1_000_000));

        user.setResetOtp(otp);
        user.setResetOtpExpiry(LocalDateTime.now().plusMinutes(10));
        userRepository.save(user);

        emailService.sendHtmlEmail(
                user.getEmail(),
                "Password Reset OTP - TeamHub",
                buildForgotPasswordEmail(user, otp)
        );
    }

    public void resetPassword(String email, String otp, String newPassword) {

        Users user = userRepository.findByEmailOnly(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!otp.equals(user.getResetOtp()))
            throw new RuntimeException("Invalid OTP");

        if (user.getResetOtpExpiry().isBefore(LocalDateTime.now()))
            throw new RuntimeException("OTP expired");

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetOtp(null);
        user.setResetOtpExpiry(null);

        userRepository.save(user);
    }

    /* ================= HELPERS ================= */
    private void attachPublicPhotoUrl(Users user) {
        if (user.getPhotoUrl() != null && !user.getPhotoUrl().startsWith("http")) {
            user.setPhotoUrl(S3_BASE_URL + user.getPhotoUrl());
        }
    }

    private LocalDate parseDateOfBirth(String dob) {
        if (dob == null || dob.isBlank()) return null;
        try {
            if (dob.matches("\\d{2}-\\d{2}-\\d{4}")) {
                String[] p = dob.split("-");
                return LocalDate.of(
                        Integer.parseInt(p[2]),
                        Integer.parseInt(p[1]),
                        Integer.parseInt(p[0])
                );
            }
            if (dob.matches("\\d{4}-\\d{2}-\\d{2}")) {
                return LocalDate.parse(dob);
            }
            return null;
        } catch (Exception e) {
            return null;
        }
    }

    private String buildForgotPasswordEmail(Users user, String otp) {
        return """
        <html>
        <body>
            <h2>Password Reset OTP</h2>
            <p>Hello %s,</p>
            <h1>%s</h1>
            <p>This OTP is valid for 10 minutes.</p>
        </body>
        </html>
        """.formatted(user.getFullName(), otp);
    }

    public void deleteuser(Integer userId) {
        userRepository.deleteById(userId);
    }
}
