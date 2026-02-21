package com.example.employee_service_mama.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class AttendanceResponseDTO {

    private Integer id;

    private String employeeName;  // FULL NAME
    private String empid;

    private LocalDate date;
    private LocalTime loginTime;
    private LocalTime logoutTime;

    private String status;
}
