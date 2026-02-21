package com.example.employee_service_mama.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "payslip")
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Payslip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    private String empid;

    @Column(name = "full_name")
    private String fullName;

    private Integer month;
    private Integer year;

    @Column(name = "file_name")
    private String fileName;   // ✅ store S3 URL here

    @Column(name = "uploaded_on")
    private LocalDate uploadedOn;
}