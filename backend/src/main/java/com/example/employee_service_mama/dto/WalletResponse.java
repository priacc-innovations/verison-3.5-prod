// src/main/java/com/example/employee_service_mama/dto/WalletResponse.java
package com.example.employee_service_mama.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WalletResponse {

    private Integer userId;
    private String empid;
    private String fullName;
    private String department;        // this will carry Users.role
    private Double monthlySalary;
    private Double dailyRate;
    private Double currentMonthEarned;
    private Double deduction;
}
