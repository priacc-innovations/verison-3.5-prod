package com.example.employee_service_mama.controller;

import com.example.employee_service_mama.service.AttendanceCsvFileService;
import com.example.employee_service_mama.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/attendance/test")
@RequiredArgsConstructor
@CrossOrigin(
        origins = {
                "https://teamhub.in",
                "http://teamhub.in",
                "http://teamhub-ALB-680655485.ap-south-1.elb.amazonaws.com",
                "http://15.206.26.130:80"
        },
        allowCredentials = "true"
)public class AttendanceTestController {

    private final AttendanceService service;
    private final AttendanceCsvFileService service1;
    @GetMapping("/finalize")
    public String runFinalizeFromCsv() {
        service1.finalizeDailyAttendanceFromCsv();
        return "CSV Finalization executed manually";
    }

    // 👉 Manually trigger 1:05 PM auto-absent logic
    @GetMapping("/weekend")
    public String runWeekendMarking() {
        service.markWeekendDays();
        return "Weekend Marking executed manually";
    }
    @GetMapping("/autoAbsent")
    public String runAutoAbsent() {
        service.autoAbsentAfter1PM();
        return "Auto Absent executed manually";
    }

    // 👉 Manually trigger 6:30 PM auto-logout logic
    @GetMapping("/autoLogout")
    public String runAutoLogout() {
        service.autoLogoutForForgotUsers();
        return "Auto Logout executed manually";
    }

    // 👉 Manually trigger sandwich policy
    @GetMapping("/sandwich")
    public String runSandwichPolicyFix() {
        service.sandwichPolicyFix();
        return "Sandwich Policy executed manually";
    }
}



