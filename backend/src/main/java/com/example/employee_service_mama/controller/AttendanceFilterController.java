

package com.example.employee_service_mama.controller;

import com.example.employee_service_mama.dto.AttendanceStatsDTO;
import com.example.employee_service_mama.dto.AttendanceStatusUpdateDTO;
import com.example.employee_service_mama.model.AttendanceCsvFile;
import com.example.employee_service_mama.service.AttendanceFilterService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
@CrossOrigin(
        origins = {
                "https://teamhub.in",
                "http://teamhub.in",
                "http://teamhub-ALB-680655485.ap-south-1.elb.amazonaws.com",
                "http://15.206.26.130:80"
        },
        allowCredentials = "true"
)public class AttendanceFilterController {

    private final AttendanceFilterService service;

    @GetMapping("/user-filter/{userId}")//employee filter atendance
    public List<AttendanceCsvFile> filterAttendance(
            @PathVariable Integer userId,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) String date
    ) {
        LocalDate parsedDate = null;
        if (date != null && !date.isBlank()) {
            parsedDate = LocalDate.parse(date);
        }

        return service.filterAttendance(userId, year, month, parsedDate);
    }
    @GetMapping("/hr-filter")
    public List<AttendanceCsvFile> filterAttendance(
            @RequestParam(required = false) String month,
            @RequestParam(required = false) String date
    ) {
        System.out.println(month + " " + date);
        return service.filterAttendance(month, date);
    }


    @PutMapping("/update-bulk")   //this is for mark attendance update status api.
    public ResponseEntity<String> updateBulkStatus(
            @RequestBody List<AttendanceStatusUpdateDTO> updates
    ) {
        service.updateBulkStatus(updates);
        return ResponseEntity.ok("Attendance updated successfully");
    }

    @GetMapping("/daily-summary")
    public List<AttendanceStatsDTO> getDailySummary() {

        List<AttendanceCsvFile> all = service.getAll();

        // Group by exact date
        Map<String, List<AttendanceCsvFile>> grouped = all.stream()
                .collect(Collectors.groupingBy(AttendanceCsvFile::getDate));

        List<AttendanceStatsDTO> summary = new ArrayList<>();

        grouped.forEach((date, list) -> {
            long present = list.stream()
                    .filter(a -> a.getStatus().equalsIgnoreCase("Present"))
                    .count();

            long absent = list.stream()
                    .filter(a -> a.getStatus().equalsIgnoreCase("Absent"))
                    .count();

            summary.add(new AttendanceStatsDTO(date, present, absent));
        });

        // Sort using actual date object, not text
        summary.sort(Comparator.comparing(s -> {
            try {
                return LocalDate.parse(s.getDate(),
                        DateTimeFormatter.ofPattern("MM/dd/yyyy"));
            } catch (Exception e) {
                return LocalDate.MIN;
            }
        }));

        return summary;
    }

}



