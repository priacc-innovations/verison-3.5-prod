package com.example.employee_service_mama.controller;

import com.example.employee_service_mama.dto.SalaryOverviewDTO;
import com.example.employee_service_mama.dto.WalletResponse;
import com.example.employee_service_mama.model.Wallet;
import com.example.employee_service_mama.service.WalletService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/salary")
@CrossOrigin(
        origins = {
                "https://teamhub.in",
                "http://teamhub.in",
                "http://teamhub-ALB-680655485.ap-south-1.elb.amazonaws.com",
                "http://15.206.26.130:80"
        },
        allowCredentials = "true"
)
@RequiredArgsConstructor
public class WalletController {

    private final WalletService walletService;

    @GetMapping("/monthsalary/{userId}")
    public Double getMonthlySalary(@PathVariable Integer userId){
        return walletService.getMonthSalary(userId);
    }

    @GetMapping("/dailyrate/{userId}")
    public Double getDailyRate(@PathVariable Integer userId){
        return walletService.getDailyRate(userId);
    }

    @GetMapping("/totalsalary")
    public Double getTotalSalary(){
        return walletService.getTotalSalary();
    }

    @PutMapping("/add/deduction/{empid}/{amount}")
    public String addDeduction(@PathVariable String empid,
                               @PathVariable Double amount){
        return walletService.addDeduction(empid, amount);
    }

    @GetMapping("/netpayable")
    public Double getNetPayable(){
        return walletService.getNetPayable();
    }

    @GetMapping("/totaldeduction")
    public Double getTotalDeduction(){
        return walletService.getTotalDeduction();
    }


    @GetMapping("/all")
    public List<WalletResponse> getAllSalaryDetails() {
        return walletService.getAllSalaryResponses();
    }

    @GetMapping("/salary-details/{userId}")//current month salay details
    public Wallet getSalaryDetails(@PathVariable Integer userId) {
        return walletService.getSalaryDetails(userId);
    }
    @GetMapping("/deduction/{userId}")
    public Double deductionamount(@PathVariable Integer userId){
        return walletService.deductionamount(userId);
    }
    @GetMapping("/current-earned/{userId}")//current month earnings employee service
    public ResponseEntity<Double> getCurrentEarned(@PathVariable Integer userId) {
        return ResponseEntity.ok(walletService.getCurrentMonthEarnings(userId));
    }
    @GetMapping("/filter/{userId}")//employee service filter wallet
    public Wallet filterWalletHistory(
            @PathVariable Integer userId,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month

    ) {
        return walletService.filterWalletByUser(userId, year, month);
    }
    @GetMapping("/overview/current")//hr service salary management salary overview
    public List<SalaryOverviewDTO> getCurrentMonthOverview() {
        return walletService.getCurrentMonthOverview();
    }

    // 2️⃣ FILTER BY YEAR + MONTH
    @GetMapping("/overview")//hr servicesalary management filter
    public List<SalaryOverviewDTO> getFilteredOverview(
            @RequestParam int year,
            @RequestParam int month
    ) {
        return walletService.getSalaryOverview(year, month);
    }

}


