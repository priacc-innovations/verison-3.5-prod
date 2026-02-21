package com.example.employee_service_mama.service;

import com.example.employee_service_mama.dto.AttendanceResponseDTO;
import com.example.employee_service_mama.dto.AttendanceStatusUpdateDTO;
import com.example.employee_service_mama.dto.WeeklyAttendanceDTO;
import com.example.employee_service_mama.model.Attendance;
import com.example.employee_service_mama.model.Users;
import com.example.employee_service_mama.repository.AttendanceRepository;
import com.example.employee_service_mama.repository.HolidayRepository;
import com.example.employee_service_mama.repository.LeaveRequestsRepository;
import com.example.employee_service_mama.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.time.DayOfWeek;
import java.util.ArrayList;
@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final UserRepository userRepository;
    private final LeaveRequestsRepository leaveRepository;
    private final HolidayRepository holidayRepository;
    private final LocalTime LOGIN_START = LocalTime.of(9, 0);
    private final LocalTime FULL_PRESENT_LIMIT = LocalTime.of(9, 10);
    private final LocalTime AUTO_LOGOUT_TIME = LocalTime.of(18, 30);
    private final int FULL_DAY_HOURS = 9;
    private final int MIN_HOURS = 5;

    private boolean isWeekend(LocalDate date) {
        return date.getDayOfWeek().name().equals("SATURDAY") ||
                date.getDayOfWeek().name().equals("SUNDAY");
    }

    private long workedHours(LocalTime login, LocalTime logout) {
        return Duration.between(login, logout).toHours();
    }

    // LOGIN
    // LOGIN (corrected to prevent duplicate entries)
    public synchronized String login(Integer userId) {
        Users user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User Not Found"));

        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();
        boolean isOnLeave = leaveRepository.existsApprovedLeaveForDate(userId, today);
        if (isHoliday(today)) return "Holiday — Login not allowed";
        if (isOnLeave) {
            return "You are on approved leave today — Login not allowed";
        }
        if (isWeekend(today)) return "Weekend — Login not allowed";
        if (now.isBefore(LOGIN_START)) return "Login not allowed before 9:00 AM";


        boolean exists = attendanceRepository.existsByUserIdAndDate(userId, today);

        if (exists) {
            Attendance att = attendanceRepository.findByUserIdAndDate(userId, today);

            if (att.getLogoutTime() == null) {
                return "Already logged in today";
            }
            return "You have already logged out today — cannot login again";
        }

        Attendance attendance = Attendance.builder()
                .user(user)
                .empid(user.getEmpid())
                .date(today)
                .loginTime(now)
                .status("PRESENT")
                .remarks("Login Recorded")
                .build();

        try {
            attendanceRepository.save(attendance);
        } catch (Exception e) {
            return "Already logged in today";
        }

        return "Login Successful";
    }

    // LOGOUT Method
    public synchronized String logout(Integer userId) {
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();
        if (isHoliday(today)) return "Holiday — Logout not allowed";
        if (isWeekend(today)) return "Weekend — Logout not needed";

        boolean isOnLeave = leaveRepository.existsApprovedLeaveForDate(userId, today);
        if (isOnLeave) {
            return "You are on approved leave today — Logout not needed";
        }
        Attendance att = attendanceRepository.findByUserIdAndDate(userId, today);


        if (att == null) {
            return "You did not login today";
        }

        if (att.getLogoutTime() != null) {
            return "You have already logged out today";
        }

        att.setLogoutTime(now);

        long hours = workedHours(att.getLoginTime(), now);

        LocalTime login = att.getLoginTime();

        // Special Full Day Rule
        // Login between 09:00 - 09:05  AND Logout after 18:00
        if (!login.isAfter(FULL_PRESENT_LIMIT) && !now.isBefore(LocalTime.of(18, 0))) {
            att.setStatus("PRESENT");
            att.setRemarks("Full Day Present — Time Condition Met");
        } else {
            // 🔹 Default Logic
            if (hours < MIN_HOURS) {
                att.setStatus("ABSENT");
                att.setRemarks("Logout — Worked: " + hours + " Hrs | ABSENT");
            } else {
                if (login.isAfter(FULL_PRESENT_LIMIT)) {
                    att.setStatus("HALF_DAY");
                    att.setRemarks("Logout — Late Login | HALF DAY");
                } else {
                    String status = (hours >= FULL_DAY_HOURS) ? "PRESENT" : "HALF_DAY";
                    att.setStatus(status);
                    att.setRemarks("Logout — Worked: " + hours + " Hrs | " + status);
                }
            }
        }

        attendanceRepository.save(att);
        return "Logout Updated: " + att.getStatus();
    }



    // 1:05 PM AUTO ABSENT
    @Scheduled(cron = "0 5 13 * * MON-FRI")
    public void autoAbsentAfter1PM() {
        LocalDate today = LocalDate.now();
        if (isWeekend(today)) return;

        List<Users> users = userRepository.findAll();
        for (Users user : users) {
            Attendance att = attendanceRepository.findByUserIdAndDate(user.getId(), today);

            if (att == null) {
                Attendance a = Attendance.builder()
                        .user(user)
                        .empid(user.getEmpid())
                        .date(today)
                        .status("ABSENT")
                        .remarks("Auto Absent — No Login Before 1 PM")
                        .build();
                attendanceRepository.save(a);
            }
        }
    }

    // 6:30 PM AUTO LOGOUT
    @Scheduled(cron = "0 35 18 * * MON-FRI")
    public void autoLogoutForForgotUsers() {
        LocalDate today = LocalDate.now();
        if (isWeekend(today)) return;

        List<Users> users = userRepository.findAll();
        for (Users user : users) {
            Attendance att = attendanceRepository.findByUserIdAndDate(user.getId(), today);

            if (att != null && att.getLoginTime() != null && att.getLogoutTime() == null) {

                att.setLogoutTime(AUTO_LOGOUT_TIME);
                long hours = workedHours(att.getLoginTime(), AUTO_LOGOUT_TIME);

                if (hours < MIN_HOURS) {
                    att.setStatus("ABSENT");
                    att.setRemarks("Auto Absent — Less than 5 Hours");
                } else {
                    att.setStatus(att.getLoginTime().isAfter(FULL_PRESENT_LIMIT)
                            ? "HALF_DAY"
                            : "HALF_DAY");
                    att.setRemarks("Auto Logout — Half Day (Forgot Logout)");
                }

                attendanceRepository.save(att);
            }
        }
    }

    // WEEKEND MARKING
    @Scheduled(cron = "0 1 0 * * *") // 00:01 AM
    public void markWeekendDays() {
        LocalDate today = LocalDate.now();
        if (!isWeekend(today)) return;

        List<Users> users = userRepository.findAll();
        for (Users user : users) {
            Attendance att = attendanceRepository.findByUserIdAndDate(user.getId(), today);

            if (att == null) {
                att = Attendance.builder()
                        .user(user)
                        .empid(user.getEmpid())
                        .date(today)
                        .status("WEEKEND")
                        .remarks("Auto Weekend Marked")
                        .build();
                attendanceRepository.save(att);
            }
        }
    }

    // SANDWICH POLICY — Friday or Monday Absent → Sat & Sun Absent
    @Scheduled(cron = "0 10 0 * * *") // 12:10 AM Daily
    public void sandwichPolicyFix() {
        LocalDate today = LocalDate.now();
        List<Users> users = userRepository.findAll();

        for (Users user : users) {

            LocalDate friday = today.with(java.time.DayOfWeek.FRIDAY);
            if (friday.isAfter(today)) friday = friday.minusWeeks(1);

            LocalDate saturday = friday.plusDays(1);
            LocalDate sunday = friday.plusDays(2);
            LocalDate monday = friday.plusDays(3);

            Attendance friAtt = attendanceRepository.findByUserIdAndDate(user.getId(), friday);
            Attendance monAtt = attendanceRepository.findByUserIdAndDate(user.getId(), monday);

            boolean isFridayAbsent = friAtt != null && "ABSENT".equals(friAtt.getStatus());
            boolean isMondayAbsent = monAtt != null && "ABSENT".equals(monAtt.getStatus());

            // Apply sandwich for both cases
            if (isFridayAbsent || isMondayAbsent) {
                markAbsentOrUpdate(user, saturday);
                markAbsentOrUpdate(user, sunday);
            }
        }
    }

    private void markAbsentOrUpdate(Users user, LocalDate date) {
        Attendance att = attendanceRepository.findByUserIdAndDate(user.getId(), date);

        if (att == null) {
            att = Attendance.builder()
                    .user(user)
                    .empid(user.getEmpid())
                    .date(date)
                    .remarks("Sandwich Applied")
                    .build();
        } else {
            att.setRemarks("Sandwich Applied");
        }

        att.setStatus("ABSENT");
        attendanceRepository.save(att);
    }
    public List<AttendanceResponseDTO> getAllAttendance(String search, String date) {

        LocalDate filterDate;

        // If date not given → use TODAY'S DATE
        if (date == null || date.isBlank()) {
            filterDate = LocalDate.now();
        } else {
            filterDate = LocalDate.parse(date);
        }

        // Normalize search input
        String searchText = (search == null || search.isBlank()) ? null : search.trim();

        List<Attendance> records;

        // CASE 1: NO SEARCH → fetch today's records only
        if (searchText == null) {
            records = attendanceRepository.findByDate(filterDate);
        }
        // CASE 2: SEARCH + DATE FILTER
        else {
            records = attendanceRepository.findAllFiltered(searchText, filterDate.toString());
        }

        // Convert ENTITY → DTO
        return records.stream()
                .map(this::convertToDTO)
                .toList();
    }

    // -------------------- ENTITY → DTO CONVERTER --------------------

    private AttendanceResponseDTO convertToDTO(Attendance att) {
        AttendanceResponseDTO dto = new AttendanceResponseDTO();

        dto.setId(att.getId());
        dto.setEmployeeName(att.getUser().getFullName());   // EMPLOYEE NAME
        dto.setEmpid(att.getEmpid());

        dto.setDate(att.getDate());
        dto.setLoginTime(att.getLoginTime());
        dto.setLogoutTime(att.getLogoutTime());

        dto.setStatus(att.getStatus());

        return dto;
    }
    // ==================== MONTHLY (24 → 23) CYCLE HELPER ====================
    private LocalDate getCycleStart(LocalDate today) {
        if (today.getDayOfMonth() >= 24) {
            return today.withDayOfMonth(24);
        } else {
            return today.minusMonths(1).withDayOfMonth(24);
        }
    }

    private LocalDate getCycleEnd(LocalDate today) {
        if (today.getDayOfMonth() >= 24) {
            return today.plusMonths(1).withDayOfMonth(23);
        } else {
            return today.withDayOfMonth(23);
        }
    }

// ==================== REPORTS (Monthly Cycle Applied) ====================

    // Return all monthly records sorted by date DESC
    public List<Attendance> getAttendanceByUserId(Integer userId) {
        LocalDate today = LocalDate.now();
        LocalDate start = getCycleStart(today);
        LocalDate end = getCycleEnd(today);
        return attendanceRepository.findAttendanceHistoryForRange(userId, start, end);
    }

    // Today's attendance — no change
    public Attendance getTodayAttendance(Integer userId) {
        return attendanceRepository.findByUserIdAndDate(userId, LocalDate.now());
    }

    public Integer presentdays(Integer userId) {
        LocalDate today = LocalDate.now();
        return attendanceRepository.countPresentDaysInRange(userId, getCycleStart(today), getCycleEnd(today));
    }

    public Integer absentdays(Integer userId) {
        LocalDate today = LocalDate.now();
        return attendanceRepository.countAbsentDaysInRange(userId, getCycleStart(today), getCycleEnd(today));
    }

    public Integer halfdays(Integer userId) {
        LocalDate today = LocalDate.now();
        return attendanceRepository.countHalfDaysInRange(userId, getCycleStart(today), getCycleEnd(today));
    }

    public Integer late(Integer userId) {
        LocalDate today = LocalDate.now();
        return attendanceRepository.countLateLoginDaysInRange(userId, FULL_PRESENT_LIMIT,
                getCycleStart(today), getCycleEnd(today));
    }

    // Monthly history for UI attendance table
    public List<Attendance> getAttendancehistory(Integer userId) {
        LocalDate today = LocalDate.now();
        return attendanceRepository.findAttendanceHistoryForRange(userId, getCycleStart(today), getCycleEnd(today));
    }
    public int getTotalDaysOfPayrollMonth(Integer year, Integer month) {

        if (year == null || month == null) {
            throw new RuntimeException("Month and year are required");
        }

        LocalDate cycleStart = getCycleStartForMonth(year, month);
        LocalDate cycleEnd = getCycleEndForMonth(year, month);

        // +1 because both start and end date included
        return (int) (cycleEnd.toEpochDay() - cycleStart.toEpochDay() + 1);
    }
    private LocalDate getCycleStartForMonth(int year, int month) {
        return LocalDate.of(year, month, 1)
                .withDayOfMonth(24)
                .minusMonths(1);
    }

    private LocalDate getCycleEndForMonth(int year, int month) {
        return LocalDate.of(year, month, 1)
                .withDayOfMonth(23);
    }

    //Weekly data
    public List<WeeklyAttendanceDTO> getWeeklyAttendance(Integer userId) {

        LocalDate today = LocalDate.now();
        LocalDate monday = today.with(DayOfWeek.MONDAY);
        LocalDate friday = monday.plusDays(4);

        List<Attendance> records =
                attendanceRepository.findAttendanceHistoryForRange(userId, monday, friday);

        List<WeeklyAttendanceDTO> response = new ArrayList<>();

        for (Attendance att : records) {

            double hours = 0;
            if (att.getLoginTime() != null && att.getLogoutTime() != null) {
                hours = Duration.between(
                        att.getLoginTime(),
                        att.getLogoutTime()
                ).toMinutes() / 60.0;
            }

            response.add(
                    new WeeklyAttendanceDTO(
                            att.getDate().getDayOfWeek().name().substring(0, 3),
                            hours,
                            att.getLoginTime() != null
                                    ? att.getLoginTime().toString()
                                    : "--",
                            att.getStatus()
                    )
            );
        }

        return response;
    }
    //added by venkatasagar
    public List<Attendance> getFullAttendanceHistory(Integer userId) {
        return attendanceRepository.findByUserIdOrderByDateDesc(userId);
    }
    @Transactional
    public void updateBulkStatusByEmpidAndDate(
            List<AttendanceStatusUpdateDTO> updates
    ) {

        if (updates == null || updates.isEmpty()) {
            throw new IllegalArgumentException("No attendance updates provided");
        }

        for (AttendanceStatusUpdateDTO dto : updates) {

            updateStatusByEmpidAndDate(
                    dto.getEmpId(),
                    LocalDate.parse(dto.getDate()),
                    dto.getStatus(),
                    "Changed by HR"
            );
        }
    }
    @Transactional
    public void updateStatusByEmpidAndDate(
            String empid,
            LocalDate date,
            String status,
            String remark
    ) {

        Users user = userRepository.findByEmpid(empid)
                .orElseThrow(() ->
                        new RuntimeException("User not found: " + empid)
                );

        Attendance attendance =
                attendanceRepository.findByEmpidAndDate(empid, date);

        if (attendance == null) {
            attendance = Attendance.builder()
                    .user(user)
                    .empid(user.getEmpid())
                    .date(date)
                    .build();
        }

        attendance.setStatus(status);
        attendance.setRemarks(
                remark != null ? remark : "Marked by HR"
        );

        attendanceRepository.save(attendance);
    }
    public List<Attendance> getAttendanceHistory(
            Integer userId,
            Integer year,
            Integer month,
            LocalDate date
    ) {

        // 1️⃣ Exact date filter
        if (date != null) {
            Attendance record =
                    attendanceRepository.findByuserIdAndDate(userId, date);

            return record == null ? List.of() : List.of(record);
        }

        // 2️⃣ Year + Month → payroll cycle
        if (year != null && month != null) {
            LocalDate start = getCycleStartForMonth(year, month);
            LocalDate end   = getCycleEndForMonth(year, month);

            return attendanceRepository
                    .findAttendanceHistoryForRange(userId, start, end);
        }

        // 3️⃣ Only Year → full year
        if (year != null) {
            LocalDate start = LocalDate.of(year, 1, 1);
            LocalDate end   = LocalDate.of(year, 12, 31);

            return attendanceRepository
                    .findAttendanceHistoryForRange(userId, start, end);
        }

        // 4️⃣ Default → current payroll cycle
        LocalDate today = LocalDate.now();
        return attendanceRepository.findAttendanceHistoryForRange(
                userId,
                getCurrentCycleStart(today),
                getCurrentCycleEnd(today)
        );
    }
    private LocalDate getCurrentCycleStart(LocalDate today) {
        return today.getDayOfMonth() < 24
                ? today.withDayOfMonth(24).minusMonths(1)
                : today.withDayOfMonth(24);
    }

    private LocalDate getCurrentCycleEnd(LocalDate today) {
        return today.getDayOfMonth() < 24
                ? today.withDayOfMonth(23)
                : today.withDayOfMonth(23).plusMonths(1);
    }
    private boolean isHoliday(LocalDate date) {
        return holidayRepository.existsByDate(date);
    }

}