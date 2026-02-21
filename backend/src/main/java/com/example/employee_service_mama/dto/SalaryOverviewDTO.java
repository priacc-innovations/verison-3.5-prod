package com.example.employee_service_mama.dto;

import lombok.Data;

@Data
public class SalaryOverviewDTO {

    private String empid;
    private String fullName;
    private String department;

    private Double monthlySalary;
    private Double deduction;

    private Double earnedSalary;     // based on paid days * dailyRate
    private Double netSalary;        // earnedSalary - deduction

    private Double paidDays;         // weighted (ex: 21.5)
    private Integer totalPayrollDays;

    private String attendanceSummary;  // example: "21.5 / 31"
}
