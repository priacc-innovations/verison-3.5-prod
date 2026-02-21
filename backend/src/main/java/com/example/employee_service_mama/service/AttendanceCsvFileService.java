package com.example.employee_service_mama.service;

import com.example.employee_service_mama.model.Attendance;
import com.example.employee_service_mama.model.AttendanceCsvFile;
import com.example.employee_service_mama.model.Users;
import com.example.employee_service_mama.repository.AttendanceCsvFileRepository;
import com.example.employee_service_mama.repository.AttendanceRepository;
import com.example.employee_service_mama.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttendanceCsvFileService {

    private final AttendanceCsvFileRepository repo;
    private final UserRepository userRepo;
    private final AttendanceRepository attendanceRepository; // used to update main attendance table

    private final LocalTime LOGIN_START = LocalTime.of(9, 0);
    private final LocalTime FULL_PRESENT_LIMIT = LocalTime.of(9, 5);
    private final LocalTime AUTO_LOGOUT_TIME = LocalTime.of(18, 30);
    private final int FULL_DAY_HOURS = 9;
    private final int MIN_HOURS = 5;
    // ===========================
    // BULK UPLOAD CSV (SAME AS YOUR LOGIC)
    // ===========================
    public String saveBulk(List<AttendanceCsvFile> sheetRecords) {

        if (sheetRecords == null || sheetRecords.isEmpty()) {
            return "Sheet is empty!";
        }

        // Extract date from first non-empty row
        String recordDate = sheetRecords.stream()
                .map(AttendanceCsvFile::getDate)
                .filter(Objects::nonNull)
                .filter(d -> !d.isBlank())
                .findFirst()
                .orElseThrow(() -> new RuntimeException("Invalid date format in CSV"));

        // Prevent duplicate upload
        if (!repo.findByDate(recordDate).isEmpty()) {
            return "CSV for this date already exists!";
        }

        List<Users> allEmployees = userRepo.findAll();

        // Collect empids present in sheet
        Set<String> sheetEmpIds = sheetRecords.stream()
                .map(AttendanceCsvFile::getEmployeeId)
                .collect(Collectors.toSet());

        // Set Present for all uploaded rows (HR can later change status in UI if needed)
        sheetRecords.forEach(r -> {
            if (r.getStatus() == null || r.getStatus().isBlank()) {
                r.setStatus("PRESENT");
            }
            if (r.getRemark() == null) r.setRemark("");
        });

        // Add absentees for all employees not in sheet
        List<AttendanceCsvFile> absentees = new ArrayList<>();
        for (Users emp : allEmployees) {
            if (!sheetEmpIds.contains(emp.getEmpid())) {
                absentees.add(
                        AttendanceCsvFile.builder()
                                .employeeId(emp.getEmpid())
                                .name(emp.getFullName())
                                .domain(emp.getDomain())
                                .date(recordDate)
                                .status("ABSENT")
                                .remark("")
                                .build()
                );
            }
        }

        repo.saveAll(sheetRecords);
        repo.saveAll(absentees);

        return "Attendance CSV imported successfully for " + recordDate;
    }


    // ===========================
    // BASIC OPERATIONS
    // ===========================
    public List<AttendanceCsvFile> getAll() {
        return repo.findAll();
    }


    public List<AttendanceCsvFile> filterAttendance(String month, String date) {

        List<AttendanceCsvFile> all = repo.findAll();

        // Filter by Month (MM in MM/dd/yyyy)
        if (month != null && !month.isEmpty()) {
            int monthIndex = Month.valueOf(month.toUpperCase()).getValue();
            all = all.stream()
                    .filter(a -> {
                        try {
                            String[] parts = a.getDate().split("/");
                            return Integer.parseInt(parts[0]) == monthIndex;
                        } catch (Exception e) {
                            return false;
                        }
                    })
                    .collect(Collectors.toList());
        }

        // Filter by specific Date string
        if (date != null && !date.isEmpty()) {
            all = all.stream()
                    .filter(a -> a.getDate().equals(date))
                    .collect(Collectors.toList());
        }

        return all;
    }


    public String updateStatus(int id, String newStatus) {
        AttendanceCsvFile row = repo.findById(id).orElse(null);
        if (row == null) return "Record not found";

        row.setStatus(newStatus);
        repo.save(row);
        return "Status updated";
    }


    public Map<String, Long> getTodayStats() {

        String today = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd"));
        List<AttendanceCsvFile> todayRecords = repo.findByDate(today);

        Map<String, Long> stats = new HashMap<>();
        stats.put("total", (long) todayRecords.size());
        stats.put("present", todayRecords.stream().filter(r -> "Present".equalsIgnoreCase(r.getStatus())).count());
        stats.put("absent", todayRecords.stream().filter(r -> "Absent".equalsIgnoreCase(r.getStatus())).count());
        stats.put("leave", todayRecords.stream().filter(r -> "Leave".equalsIgnoreCase(r.getStatus())).count());
        stats.put("late", todayRecords.stream().filter(r -> "Late".equalsIgnoreCase(r.getStatus())).count());
        stats.put("halfDay", todayRecords.stream().filter(r -> "Half_day".equalsIgnoreCase(r.getStatus())).count());

        return stats;
    }


    // =====================================================================================
    // ⭐ FINAL ATTENDANCE FINALIZATION FROM CSV + ATTENDANCE TABLE AFTER 6:30 PM ⭐
    // =====================================================================================
    @Scheduled(cron = "0 40 18 * * MON-FRI") // 6:40 PM — Only weekdays
    public void finalizeDailyAttendanceFromCsv() {

        LocalDate today = LocalDate.now();
        String todayStr = today.toString();

        List<AttendanceCsvFile> csvRecords = repo.findByDate(todayStr);
        if (csvRecords.isEmpty()) return;

        for (AttendanceCsvFile csv : csvRecords) {

            String empid = csv.getEmployeeId();
            if (empid == null || empid.trim().isEmpty()) continue;

            Users user = userRepo.findByEmpid(empid).orElse(null);
            if (user == null) continue;

            Attendance att = attendanceRepository.findByUserIdAndDate(user.getId(), today);

            String csvStatus = csv.getStatus() != null ? csv.getStatus().toUpperCase().trim() : "ABSENT";
            if (csvStatus.isEmpty()) csvStatus = "ABSENT";

            long workedHours = 0;
            LocalTime login = null;
            LocalTime logout = null;

            if (att != null) {
                login = att.getLoginTime();
                logout = att.getLogoutTime();

                if (login != null && logout != null) {
                    workedHours = Duration.between(login, logout).toHours();
                }
            }

            String finalStatus;
            String finalRemark;

            switch (csvStatus) {

                case "ABSENT":
                    finalStatus = "ABSENT";
                    finalRemark = "Absent For Today's Standup Call";
                    break;

                case "LEAVE":
                    finalStatus = "LEAVE";
                    finalRemark = "Finalized from CSV: Leave";
                    break;

                case "HALF_DAY":
                case "HALF-DAY":
                case "HALFDAY":
                    finalStatus = "HALF_DAY";
                    finalRemark = "Finalized from CSV: Half Day";
                    break;

                default: // PRESENT or any other input
                    if (att == null || login == null) {
                        finalStatus = "ABSENT";
                        finalRemark = "No Login Found ⇒ Absent";
                    } else {
                        if (!login.isAfter(FULL_PRESENT_LIMIT) &&
                                logout != null &&
                                !logout.isBefore(LocalTime.of(18, 0))) {

                            finalStatus = "PRESENT";
                            finalRemark = "Full Day Present — Time Condition Met";

                        } else {
                            if (workedHours < MIN_HOURS) {
                                finalStatus = "ABSENT";
                                finalRemark = "Worked: " + workedHours + " Hrs ⇒ ABSENT";
                            } else if (login.isAfter(FULL_PRESENT_LIMIT)) {
                                finalStatus = "HALF_DAY";
                                finalRemark = "Late Login ⇒ HALF DAY";
                            } else {
                                finalStatus = (workedHours >= FULL_DAY_HOURS) ? "PRESENT" : "HALF_DAY";
                                finalRemark = "Worked: " + workedHours + " Hrs ⇒ " + finalStatus;
                            }
                        }
                    }
                    break;
            }

            if (att == null) {
                att = Attendance.builder()
                        .user(user)
                        .empid(user.getEmpid())
                        .date(today)
                        .build();
            }

            att.setStatus(finalStatus);
            att.setRemarks(finalRemark);
            attendanceRepository.save(att);
        }

        System.out.println("✔ Attendance Finalized using Login/Logout Rules - " + todayStr);
    }
}
