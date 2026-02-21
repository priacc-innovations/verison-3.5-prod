package com.example.employee_service_mama.dto;

import lombok.Data;

@Data
public class AttendanceStatusUpdateDTO {
    private String empId;
    private String date;    // YYYY-MM-DD
    private String status;
}
