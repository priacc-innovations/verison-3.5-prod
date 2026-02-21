package com.example.employee_service_mama.controller;

import com.example.employee_service_mama.dto.AttendanceResponseDTO;
import com.example.employee_service_mama.dto.AttendanceStatusUpdateDTO;
import com.example.employee_service_mama.dto.WeeklyAttendanceDTO;
import com.example.employee_service_mama.model.Attendance;
import com.example.employee_service_mama.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attendance")
@CrossOrigin(
        origins = {
                "https://teamhub.in",
                "http://teamhub.in",
                "http://teamhub-ALB-680655485.ap-south-1.elb.amazonaws.com",
                "http://15.206.26.130:80"
        },
        allowCredentials = "true"
)@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;

    // OLD → Get ALL attendance (list)
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Attendance>> getAttendanceByUserId(@PathVariable Integer userId) {
        return ResponseEntity.ok(attendanceService.getAttendanceByUserId(userId));
    }

    // OLD → Get today's attendance (single)
    @GetMapping("/today/{userId}")
    public ResponseEntity<Attendance> getTodayAttendance(@PathVariable Integer userId) {
        return ResponseEntity.ok(attendanceService.getTodayAttendance(userId));
    }

    // NEW LOGIC ADDED → History list
    @GetMapping("/history/{userId}")//attendance history filter in employee service
    public ResponseEntity<List<Attendance>> getAttendanceHistory(
            @PathVariable Integer userId,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) String date
    ) {

        LocalDate parsedDate = null;
        if (date != null && !date.isBlank()) {
            parsedDate = LocalDate.parse(date);
        }

        return ResponseEntity.ok(
                attendanceService.getAttendanceHistory(
                        userId, year, month, parsedDate
                )
        );
    }

    // OLD → Present days
    @GetMapping("/presentdays/{userId}")
    public ResponseEntity<Integer> getPresentDays(@PathVariable Integer userId) {
        return ResponseEntity.ok(attendanceService.presentdays(userId));
    }

    // NEW LOGIC ADDED → Absent
    @GetMapping("/absentdays/{userId}")
    public ResponseEntity<Integer> getAbsentDays(@PathVariable Integer userId) {
        return ResponseEntity.ok(attendanceService.absentdays(userId));
    }

    // NEW LOGIC ADDED → Half-days
    @GetMapping("/halfdays/{userId}")
    public ResponseEntity<Integer> getHalfDays(@PathVariable Integer userId) {
        return ResponseEntity.ok(attendanceService.halfdays(userId));
    }

    // NEW LOGIC ADDED → Late count
    @GetMapping("/late/{userId}")
    public ResponseEntity<Integer> getLateDays(@PathVariable Integer userId) {
        return ResponseEntity.ok(attendanceService.late(userId));
    }

    // OLD → Login
    @PostMapping("/login/{userId}")
    public ResponseEntity<String> login(@PathVariable Integer userId) {
        return ResponseEntity.ok(attendanceService.login(userId));
    }

    // OLD → Logout
    @PutMapping("/logout/{userId}")
    public ResponseEntity<String> logout(@PathVariable Integer userId) {
        return ResponseEntity.ok(attendanceService.logout(userId));
    }
    @GetMapping("/all")
    public ResponseEntity<List<AttendanceResponseDTO>> getAllAttendance(
            @RequestParam(required = false, defaultValue = "") String search,
            @RequestParam(required = false, defaultValue = "") String date
    ) {
        List<AttendanceResponseDTO> response = attendanceService.getAllAttendance(search, date);
        return ResponseEntity.ok(response);
    }
    @GetMapping("/payroll-days")//total days in myattendance api
    public Map<String, Integer> getPayrollDays(
            @RequestParam Integer year,
            @RequestParam Integer month
    ) {
        int totalDays = attendanceService.getTotalDaysOfPayrollMonth(year, month);

        return Map.of("totalPayrollDays", totalDays);
    }
    //weekly added by venkatasagar for clockin/clock out dashboard
    @GetMapping("/weekly/{userId}")
    public ResponseEntity<List<WeeklyAttendanceDTO>> getWeeklyAttendance(
            @PathVariable Integer userId
    ) {
        return ResponseEntity.ok(attendanceService.getWeeklyAttendance(userId));
    }

    //for history of all data 01/01/2025 by venkatasgar
    @GetMapping("/full-history/{userId}")
    public ResponseEntity<List<Attendance>> getFullAttendanceHistory(
            @PathVariable Integer userId
    ) {
        return ResponseEntity.ok(attendanceService.getFullAttendanceHistory(userId));
    }
    @PutMapping("/updateStatus-bulk")  //this is for attendance repo update status.
    public ResponseEntity<String> updateBulkAttendanceStatus(
            @RequestBody List<AttendanceStatusUpdateDTO> updates
    ) {

        attendanceService.updateBulkStatusByEmpidAndDate(updates);

        return ResponseEntity.ok("Attendance updated successfully for all employees");
    }

}




