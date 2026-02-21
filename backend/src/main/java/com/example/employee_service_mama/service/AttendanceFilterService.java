package com.example.employee_service_mama.service;

import com.example.employee_service_mama.dto.AttendanceStatusUpdateDTO;
import com.example.employee_service_mama.model.AttendanceCsvFile;
import com.example.employee_service_mama.repository.AttendanceCsvFileRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.Month;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttendanceFilterService {

    private final AttendanceCsvFileRepository repo;
    public List<AttendanceCsvFile> filterAttendance(String month, String date) {

        List<AttendanceCsvFile> all = repo.findAll();

        Integer targetMonth = null;
        LocalDate targetDate = null;

        // Parse Month (1–12)
        if (month != null && !month.isBlank()) {
            try {
                targetMonth = Integer.parseInt(month); // "12"
            } catch (Exception e) {
                try {
                    targetMonth = Month.valueOf(month.toUpperCase()).getValue(); // "DECEMBER"
                } catch (Exception ignore) {}
            }
        }

        // Parse Date (YYYY-MM-DD)
        if (date != null && !date.isBlank()) {
            try {
                targetDate = LocalDate.parse(date);  // browser sends YYYY-MM-DD
            } catch (Exception ignore) {}
        }

        Integer finalMonth = targetMonth;
        LocalDate finalDate = targetDate;

        return all.stream()
                .filter(row -> {

                    if (row.getDate() == null || row.getDate().isBlank()) {
                        return false;
                    }

                    LocalDate recordDate;
                    try {
                        recordDate = LocalDate.parse(row.getDate()); // parse DB "YYYY-MM-DD"
                    } catch (Exception e) {
                        return false;
                    }

                    // Filter by date
                    if (finalDate != null && !recordDate.equals(finalDate)) {
                        return false;
                    }

                    // Filter by month
                    if (finalMonth != null && recordDate.getMonthValue() != finalMonth) {
                        return false;
                    }

                    return true;
                })
                .collect(Collectors.toList());
    }
    // @Cacheable(value = "attendanceAllCache")
    public List<AttendanceCsvFile> filterAttendance(Integer userId,Integer year, Integer month, LocalDate date) {

        List<AttendanceCsvFile> all = repo.findAll();

        // Filter by exact date
        if (date != null) {
            return all.stream()
                    .filter(a -> LocalDate.parse(a.getDate()).equals(date))
                    .collect(Collectors.toList());
        }

        // Filter by month + year
        if (year != null && month != null) {
            LocalDate cycleStart = getCycleStartForMonth(year, month);
            LocalDate cycleEnd = getCycleEndForMonth(year, month);

            return all.stream()
                    .filter(a -> {
                        LocalDate d = LocalDate.parse(a.getDate());
                        return !d.isBefore(cycleStart) && !d.isAfter(cycleEnd);
                    })
                    .collect(Collectors.toList());
        }

        // Current Active Cycle Filter (Default)
        LocalDate start = getCurrentCycleStart();
        LocalDate end = getCurrentCycleEnd();

        return all.stream()
                .filter(a -> {
                    LocalDate d = LocalDate.parse(a.getDate());
                    return !d.isBefore(start) && !d.isAfter(end);
                })
                .collect(Collectors.toList());
    }




    //@CacheEvict(value = {"attendanceAllCache"}, allEntries = true)

    public List<AttendanceCsvFile> getAll() {
        return repo.findAll();
    }
    private LocalDate getCycleStartForMonth(int year, int month) {
        // month = 12 → Cycle Start = 24 Nov (for Dec cycle)
        return LocalDate.of(year, month, 1)
                .withDayOfMonth(24)
                .minusMonths(1);
    }

    private LocalDate getCycleEndForMonth(int year, int month) {
        // month = 12 → Cycle End = 23 Dec
        return LocalDate.of(year, month, 1)
                .withDayOfMonth(23);
    }

    private LocalDate getCurrentCycleStart() {
        LocalDate today = LocalDate.now();
        if (today.getDayOfMonth() < 24) {
            return today.withDayOfMonth(24).minusMonths(1);
        }
        return today.withDayOfMonth(24);
    }

    private LocalDate getCurrentCycleEnd() {
        LocalDate today = LocalDate.now();
        if (today.getDayOfMonth() < 24) {
            return today.withDayOfMonth(23);
        }
        return today.withDayOfMonth(23).plusMonths(1);
    }
    @Transactional
    public void updateBulkStatus(List<AttendanceStatusUpdateDTO> updates) {

        if (updates == null || updates.isEmpty()) {
            throw new IllegalArgumentException("No attendance updates provided");
        }

        for (AttendanceStatusUpdateDTO dto : updates) {
            updateSingle(dto);
        }
    }

    /* ================= CORE UPDATE ================= */
    private void updateSingle(AttendanceStatusUpdateDTO dto) {

        validate(dto);

        String empId = dto.getEmpId();
        String date = dto.getDate();
        String status = normalizeStatus(dto.getStatus());

        AttendanceCsvFile csv =
                repo.findByEmployeeIdAndDate(empId, date)
                        .orElseGet(() ->
                                AttendanceCsvFile.builder()
                                        .employeeId(empId)
                                        .date(date)
                                        .remark("Marked by HR")
                                        .build()
                        );

        csv.setStatus(status);
        csv.setRemark("Marked by HR");

        repo.save(csv);
    }

    /* ================= VALIDATION ================= */
    private void validate(AttendanceStatusUpdateDTO dto) {

        if (dto.getEmpId() == null || dto.getEmpId().isBlank()) {
            throw new IllegalArgumentException("empId is required");
        }

        if (dto.getDate() == null || dto.getDate().isBlank()) {
            throw new IllegalArgumentException("date is required");
        }

        if (dto.getStatus() == null || dto.getStatus().isBlank()) {
            throw new IllegalArgumentException("status is required");
        }
    }

    /* ================= STATUS NORMALIZATION ================= */
    private String normalizeStatus(String status) {

        return switch (status.trim().toUpperCase()) {
            case "PRESENT" -> "PRESENT";
            case "ABSENT" -> "ABSENT";
            case "LEAVE" -> "LEAVE";
            case "LATE" -> "LATE";
            case "HALF DAY", "HALF_DAY", "HALFDAY" -> "HALF_DAY";
            default -> "ABSENT";
        };
    }


}

