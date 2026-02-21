package com.example.employee_service_mama.service;

import com.example.employee_service_mama.dto.WalletResponse;
import com.example.employee_service_mama.model.Attendance;
import com.example.employee_service_mama.model.Users;
import com.example.employee_service_mama.model.Wallet;
import com.example.employee_service_mama.repository.AttendanceRepository;
import com.example.employee_service_mama.repository.UserRepository;
import com.example.employee_service_mama.repository.WalletRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.example.employee_service_mama.dto.SalaryOverviewDTO;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;


@Service
@RequiredArgsConstructor
@Slf4j
public class WalletService {

    private final WalletRepository walletRepository;
    private final AttendanceRepository attendanceRepository;
    private final UserRepository userRepository;

    // -------------------- SMALL HELPERS --------------------

    private void validateUserExists(Integer userId) {
        if (!userRepository.existsById(userId)) {
            throw new RuntimeException("User not found: " + userId);
        }
    }

    private double safeDouble(Double value) {
        return value == null ? 0.0 : value;
    }

    // -------------------- PUBLIC QUERIES (PER USER – CURRENT CYCLE) --------------------

    // Monthly salary for current active cycle
    public Double getMonthSalary(Integer userId) {
        validateUserExists(userId);
        return walletRepository.findActiveWalletForUser(userId)
                .map(w -> safeDouble(w.getMonthlySalary()))
                .orElse(0.0);
    }

    // Daily rate for current active cycle
    public Double getDailyRate(Integer userId) {
        validateUserExists(userId);
        return walletRepository.findActiveWalletForUser(userId)
                .map(w -> safeDouble(w.getDailyRate()))
                .orElse(0.0);
    }

    // LIVE current month earned (24th prev month → 23rd this/next month)
    public Double getCurrentMonthEarnings(Integer userId) {
        validateUserExists(userId);
        return walletRepository.findActiveWalletForUser(userId)
                .map(w -> safeDouble(w.getCurrentMonthEarned()))
                .orElse(0.0);
    }

    // Current deduction for the active wallet of user
    public Double deductionamount(Integer userId) {
        validateUserExists(userId);
        return walletRepository.findActiveWalletForUser(userId)
                .map(w -> safeDouble(w.getDeduction()))
                .orElse(0.0);
    }

    // Salary details for current cycle (active wallet row)
    public Wallet getSalaryDetails(Integer userId) {
        validateUserExists(userId);
        return walletRepository.findActiveWalletForUser(userId).orElse(null);
    }

    // -------------------- AGGREGATE QUERIES (ALL USERS – CURRENT CYCLE) --------------------

    public Double getTotalSalary() {
        // implement in repo as sum of monthlySalary for active wallets (cycleEnd IS NULL)
        return safeDouble(walletRepository.totalmonthsalary());
    }

    public Double getNetPayable() {
        // implement in repo as sum of currentMonthEarned for active wallets
        return safeDouble(walletRepository.currentMonthEarned());
    }

    public Double getTotalDeduction() {
        // implement in repo as sum of deduction for active wallets
        return safeDouble(walletRepository.totaldeduction());
    }
    public List<WalletResponse> getAllSalaryResponses() {
        return walletRepository.findAllAsResponse();
    }
    public List<SalaryOverviewDTO> getSalaryOverview(int year, int month) {

        LocalDate start = getCycleStartForMonth(year, month);
        LocalDate end   = getCycleEndForMonth(year, month);

        int totalPayrollDays =
                (int) (end.toEpochDay() - start.toEpochDay() + 1);

        List<Wallet> wallets = walletRepository.findAllWithUser();

        return wallets.stream().map(w -> {

            Double paidDays = attendanceRepository.countPaidDaysWeighted(
                    w.getUser().getId(), start, end
            );

            if (paidDays == null) paidDays = 0.0;

            double dailyRate = w.getDailyRate();
            double earnedSalary = paidDays * dailyRate;

            double deduction = w.getDeduction() == null ? 0 : w.getDeduction();
            double netSalary = earnedSalary - deduction;

            SalaryOverviewDTO dto = new SalaryOverviewDTO();

            dto.setEmpid(w.getEmpid());
            dto.setFullName(w.getUser().getFullName());
            dto.setDepartment(w.getUser().getRole());

            dto.setMonthlySalary(w.getMonthlySalary());
            dto.setDeduction(deduction);
            dto.setEarnedSalary(earnedSalary);
            dto.setNetSalary(netSalary);

            dto.setPaidDays(paidDays);
            dto.setTotalPayrollDays(totalPayrollDays);
            dto.setAttendanceSummary(paidDays + " / " + totalPayrollDays);

            return dto;

        }).toList();
    }


    public String addDeduction(String empid, Double deductionAmount) {
        Wallet wallet = walletRepository.findByEmpid(empid).orElse(null);
        if (wallet == null) {
            throw new RuntimeException("Salary details not found for Employee ID: " + empid);
        }

        double currentDeduction = safeDouble(wallet.getDeduction());
        wallet.setDeduction(currentDeduction + (deductionAmount == null ? 0.0 : deductionAmount));
        wallet.setLastUpdated(OffsetDateTime.now());
        walletRepository.save(wallet);

        return "Deduction added successfully for Employee ID: " + empid;
    }

    // -------------------- SCHEDULED JOBS --------------------

    /**
     * Updates daily earnings based on attendance.
     * Runs Mon–Fri at 18:45 after attendance is finalized.
     *
     * IMPORTANT:
     *  - Does NOT create wallet rows.
     *  - Only updates the active wallet (cycle_end IS NULL).
     */
    @Scheduled(cron = "0 45 18 * * * ")
    @Transactional
    public void updateDailySalary() {

        LocalDate today = LocalDate.now();
        List<Attendance> attendanceList = attendanceRepository.findByDate(today);

        if (attendanceList.isEmpty()) {
            log.info("No attendance records found for {}", today);
            return;
        }

        for (Attendance att : attendanceList) {

            Users user = att.getUser();
            Optional<Wallet> walletOpt = walletRepository.findActiveWalletForUser(user.getId());

            if (walletOpt.isEmpty()) {
                // No active cycle for this user → do NOT auto-create here
                log.warn("No active wallet found for userId={} (empId={}) on {}. " +
                                "Skipping salary update. Make sure monthly cycle is created on 24th.",
                        user.getId(), user.getEmpid(), today);
                continue;
            }

            Wallet wallet = walletOpt.get();
            double addAmount = calculateAmountToAdd(att.getStatus(), wallet.getDailyRate());

            if (addAmount == 0) {
                log.debug("No salary added for userId={} on {} due to status={}",
                        user.getId(), today, att.getStatus());
                continue;
            }

            double currentEarned = safeDouble(wallet.getCurrentMonthEarned());

            wallet.setCurrentMonthEarned(currentEarned + addAmount);
            wallet.setLastUpdated(OffsetDateTime.now());
            walletRepository.save(wallet);

            log.info("Updated wallet for userId={} on {}. Added={}, totalEarned={}",
                    user.getId(), today, addAmount, wallet.getCurrentMonthEarned());
        }

        log.info("Daily salary update completed for {}", today);
    }

    /**
     * Closes previous salary cycle (24 → 23) and opens a new one.
     *
     * Runs every day at 00:05, but only executes logic when today is 24th.
     */
    @Scheduled(cron = "0 5 0 * * *") // 00:05 every day
    @Transactional
    public void checkAndCreateNewCycle() {

        LocalDate today = LocalDate.now();

        // Salary cycle starts on 24th of each month
        if (today.getDayOfMonth() != 24) {
            return;
        }

        LocalDate previousCycleEnd = today.minusDays(1); // 23rd

        List<Users> users = userRepository.findAll();
        if (users.isEmpty()) {
            log.warn("No users found when creating new salary cycle for {}", today);
            return;
        }

        for (Users user : users) {
            Optional<Wallet> activeWalletOpt = walletRepository.findActiveWalletForUser(user.getId());

            Wallet activeWallet = activeWalletOpt.orElse(null);

            // 1) Close existing cycle if exists
            if (activeWallet != null) {
                activeWallet.setCycleEnd(previousCycleEnd);
                activeWallet.setLastUpdated(OffsetDateTime.now());
                walletRepository.save(activeWallet);
                log.info("Closed wallet cycle for userId={} with cycleEnd={}",
                        user.getId(), previousCycleEnd);
            }

            // 2) Create new cycle starting today (24th)
            Wallet newWallet = buildNewCycleWallet(user, activeWallet, today);

            walletRepository.save(newWallet);

            log.info("Created new wallet cycle for userId={} starting from {}",
                    user.getId(), today);
        }

        log.info("New salary cycle created for all users starting from {}", today);
    }

    // -------------------- HELPER METHODS --------------------

    private double calculateAmountToAdd(String status, Double dailyRateObj) {

        double dailyRate = safeDouble(dailyRateObj);

        if (dailyRate == 0.0 || status == null) {
            return 0.0;
        }

        switch (status) {
            case "PRESENT":
            case "WEEKEND":
            case "HOLIDAY":

                return dailyRate;

            case "HALF_DAY":
                return dailyRate / 2.0;

            case "LEAVE":
                // If your company wants paid leave, change this:
                return 0.0;

            default:
                // Unknown / Absent statuses → no pay
                return 0.0;
        }
    }

    private Wallet buildNewCycleWallet(Users user, Wallet previousActiveWallet, LocalDate cycleStartDate) {

        double monthlySalary;

        if (previousActiveWallet != null && previousActiveWallet.getMonthlySalary() != null) {
            monthlySalary = previousActiveWallet.getMonthlySalary();
        } else if (user.getBaseSalary() != null) {
            monthlySalary = user.getBaseSalary();
        } else {
            monthlySalary = 0.0;
        }

        double dailyRate;

        if (previousActiveWallet != null && previousActiveWallet.getDailyRate() != null) {
            dailyRate = previousActiveWallet.getDailyRate();
        } else {
            // 30 days fixed for simplicity
            dailyRate = monthlySalary / 30.0;
        }

        return Wallet.builder()
                .user(user)
                .empid(user.getEmpid())
                .monthlySalary(monthlySalary)
                .dailyRate(dailyRate)
                .currentMonthEarned(0.0)
                .deduction(0.0)
                .cycleStart(cycleStartDate)
                .cycleEnd(null)
                .lastUpdated(OffsetDateTime.now())
                .build();
    }

    @Transactional
    public Wallet createInitialWalletForUser(Users user) {

        Optional<Wallet> activeWalletOpt = walletRepository.findActiveWalletForUser(user.getId());
        if (activeWalletOpt.isPresent()) {
            return activeWalletOpt.get();
        }

        LocalDate cycleStart = getCurrentCycleStartDate();

        Wallet wallet = buildNewCycleWallet(user, null, cycleStart);
        walletRepository.save(wallet);

        log.info("Created initial wallet for userId={} starting from {}", user.getId(), cycleStart);
        return wallet;
    }

    private LocalDate getCurrentCycleStartDate() {
        LocalDate today = LocalDate.now();
        if (today.getDayOfMonth() < 24) {
            return today.withDayOfMonth(24).minusMonths(1);
        } else {
            return today.withDayOfMonth(24);
        }
    }
    // ******** FILTER HELPERS ********

    private LocalDate getCycleStartForMonth(int year, int month) {
        // Example: month = 12 (Dec)
        // Cycle Start = 24 Nov
        return LocalDate.of(year, month, 1)
                .withDayOfMonth(24)
                .minusMonths(1);
    }

    private LocalDate getCycleEndForMonth(int year, int month) {
        // Cycle End = 23 Dec
        return LocalDate.of(year, month, 1)
                .withDayOfMonth(23);
    }
    // ******** FILTER LOGIC ********

    public Wallet filterWalletByUser(Integer userId, Integer year, Integer month) {

        validateUserExists(userId);



        // Filter by Month + Year
        if (year != null && month != null) {
            LocalDate cycleStart = getCycleStartForMonth(year, month);
            LocalDate cycleEnd = getCycleEndForMonth(year, month);

            return walletRepository.findWalletInRange(userId, cycleStart, cycleEnd).orElse(null);
        }

        // Filter by Year Only → latest cycle of that year
        if (year != null) {
            return walletRepository.findLatestWalletForYear(userId, year).orElse(null);
        }

        // Default → Current Active Cycle
        return walletRepository.findActiveWalletForUser(userId).orElse(null);
    }

    public List<SalaryOverviewDTO> getCurrentMonthOverview() {
        int year = getCurrentYear();
        int month = getCurrentMonth();
        return getSalaryOverview(year, month);
    }
    private int getCurrentYear() { return LocalDate.now().getYear(); }

    private int getCurrentMonth() { return LocalDate.now().getMonthValue(); }
}

