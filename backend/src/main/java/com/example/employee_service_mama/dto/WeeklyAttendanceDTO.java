package com.example.employee_service_mama.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class WeeklyAttendanceDTO {
    private String day;       // Mon, Tue...
    private double hours;     // Worked hours
    private String loginTime; // 09:15
    private String status;    // PRESENT / LATE / ABSENT
}
