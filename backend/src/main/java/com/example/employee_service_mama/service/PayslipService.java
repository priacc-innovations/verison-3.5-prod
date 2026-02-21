package com.example.employee_service_mama.service;

import com.example.employee_service_mama.dto.PayslipDto;
import com.example.employee_service_mama.model.Payslip;
import com.example.employee_service_mama.model.Users;
import com.example.employee_service_mama.repository.PayslipRepository;
import com.example.employee_service_mama.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.time.LocalDate;
import java.time.Month;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PayslipService {

    private final PayslipRepository repo;
    private final UserRepository userRepo;
    private final S3Client s3;

    private static final String BUCKET = "teamhub-storage-new";
    private static final String S3_BASE_URL =
            "https://teamhub-storage-new.s3.ap-south-1.amazonaws.com/";

    // --------------------- UPLOAD (ASYNC) ---------------------
    // @Async
    public void uploadAsync(
            String empid,
            Integer month,
            Integer year,
            MultipartFile file
    ) {

        try {
            if (file == null || file.isEmpty()) {
                throw new RuntimeException("Empty payslip file");
            }

            Users user = userRepo.findByEmpid(empid)
                    .orElseThrow(() -> new RuntimeException("User not found: " + empid));

            String safeName = user.getFullName().replaceAll("\\s+", "_");
            String key = "payslips/" + year + "/" + month + "/" +
                    empid + "-" + safeName + ".pdf";

            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(BUCKET)
                    .key(key)
                    .contentType("application/pdf")
                    .build();

            s3.putObject(
                    request,
                    software.amazon.awssdk.core.sync.RequestBody.fromBytes(file.getBytes())
            );

            Payslip payslip = Payslip.builder()
                    .empid(empid)
                    .fullName(user.getFullName())
                    .month(month)
                    .year(year)
                    .fileName(S3_BASE_URL + key)   // ✅ FIXED
                    .uploadedOn(LocalDate.now())
                    .build();

            repo.save(payslip);

        } catch (Exception e) {
            // In production → log to file / ELK
            e.printStackTrace();
        }
    }

    // --------------------- LIST DTO ---------------------
    public List<PayslipDto> getPayslipDtos(String empid) {
        return repo.findByEmpidOrderByYearDescMonthDesc(empid)
                .stream()
                .map(p -> new PayslipDto(
                        p.getId(),
                        p.getMonth(),
                        p.getYear(),
                        p.getFileName(),
                        p.getUploadedOn(),
                        p.getEmpid(),
                        p.getFullName()
                ))
                .toList();
    }

    // --------------------- DOWNLOAD URL ---------------------
    public String getUrlById(Integer id) {
        Payslip p = repo.findById(id)
                .orElseThrow(() -> new RuntimeException("Payslip not found"));
        return p.getFileName(); // S3 URL
    }
}
