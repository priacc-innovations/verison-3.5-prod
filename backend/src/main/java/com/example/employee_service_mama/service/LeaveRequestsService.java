package com.example.employee_service_mama.service;

import com.example.employee_service_mama.model.LeaveRequest;
import com.example.employee_service_mama.model.Users;
import com.example.employee_service_mama.repository.LeaveRequestsRepository;
import com.example.employee_service_mama.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class LeaveRequestsService {

    private final LeaveRequestsRepository leaveRepo;
    private final UserRepository userRepo;
    private final EmailService emailService;

    public LeaveRequestsService(LeaveRequestsRepository leaveRepo, UserRepository userRepo,EmailService emailService) {
        this.leaveRepo = leaveRepo;
        this.userRepo = userRepo;
        this.emailService= emailService;
    }

    public LeaveRequest applyLeave(Integer userId, String start, String end, String reason) {

        Users user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        LeaveRequest leave = LeaveRequest.builder()
                .user(user)
                .empid(user.getEmpid()) // add by venkatasagar 26/11/2025
                .startDate(java.time.LocalDate.parse(start))
                .endDate(java.time.LocalDate.parse(end))
                .reason(reason)
                .status("pending")
                .build();

        return leaveRepo.save(leave);
    }

    public List<LeaveRequest> getUserLeaves(Integer userId) {
        return leaveRepo.findLeaveByUserId(userId);
    }

    public List<LeaveRequest> getAllLeaves() {
        return leaveRepo.findAllByOrderByCreatedAtDesc();
    }

    public LeaveRequest approveLeave(Integer leaveId, Integer hrId) {
        LeaveRequest leave = leaveRepo.findById(leaveId)
                .orElseThrow(() -> new RuntimeException("Leave not found"));

        Users user = leave.getUser();
        Users hr = userRepo.findById(hrId)
                .orElseThrow(() -> new RuntimeException("HR not found"));

        leave.setStatus("approved");
        leave.setApprovalDate(OffsetDateTime.now());
        leave.setApprovedBy(hr);
        leave.setEmpid(user.getEmpid());
        leaveRepo.save(leave);

        // 📧 Send approval mail
        String subject = "Leave Request Approved - Priacc Innovations";
        String htmlBody = buildApprovedEmail(user, hr, leave);
        emailService.sendHtmlEmail(user.getEmail(), subject, htmlBody);

        return leave;
    }

    public LeaveRequest rejectLeave(Integer leaveId, Integer hrId) {
        LeaveRequest leave = leaveRepo.findById(leaveId)
                .orElseThrow(() -> new RuntimeException("Leave not found"));

        Users user = leave.getUser();
        Users hr = userRepo.findById(hrId)
                .orElseThrow(() -> new RuntimeException("HR not found"));

        leave.setStatus("rejected");
        leave.setApprovalDate(OffsetDateTime.now());
        leave.setApprovedBy(hr);
        leave.setEmpid(user.getEmpid());
        leaveRepo.save(leave);

        // 📧 Send rejected mail
        String subject = "Leave Request Rejected - Priacc Innovations";
        String htmlBody = buildRejectedEmail(user, hr, leave);
        emailService.sendHtmlEmail(user.getEmail(), subject, htmlBody);

        return leave;
    }


    // -------------------- EMAIL TEMPLATES --------------------

    /**
     * HTML template for APPROVED leave.
     */
    private String buildApprovedEmail(Users user, Users hr, LeaveRequest leave) {

        return """
<html>
<body style='font-family: Arial, sans-serif; background:#f7f7f7; padding:20px;'>
    <div style='background:#ffffff; border-radius:8px; padding:20px; max-width:600px; margin:auto;'>

        <h2 style='color:#4B0082; margin-bottom:10px;'>Leave Request Approved</h2>

        <p>Hi <strong>%s</strong>,</p>
        <p>Great news! Your leave request has been successfully approved.</p>

        <div style='background:#f8f8f8; padding:12px 16px; border-left:4px solid #4B0082; margin:18px 0;'>
            <p style='margin:4px 0;'><strong>Leave Duration :</strong> %s to %s</p>
            <p style='margin:4px 0;'><strong>Reason Provided:</strong> %s</p>
            <p style='margin:4px 0;'><strong>Approved By :</strong> %s</p>
        </div>

        <p>We hope you have a restful and refreshing time during your leave.</p>
        <p>If you have any questions, please feel free to contact the HR team.</p>

        <p style='margin-top:24px;'>
            Warm regards,<br/>
            <strong>%s</strong><br/>
            Human Resources<br/>
            Priacc Innovations
        </p>

        <!-- FOOTER WITH LOGO LEFT + COPYRIGHT RIGHT -->
        <table width='100%%' style='margin-top:30px;'>
            <tr>
                <td style='text-align:left;'>
                    <img src='cid:priaccLogo' alt='Priacc Innovations' style='width:140px;' />
                </td>
                <td style='text-align:right; font-size:12px; color:#777;'>
                    © Priacc Innovations — New Revolution in Software
                </td>
            </tr>
        </table>

    </div>
</body>
</html>
""".formatted(
                user.getFullName(),
                leave.getStartDate(),
                leave.getEndDate(),
                leave.getReason(),
                hr.getFullName(),
                hr.getFullName()
        );
    }

    /**
     * HTML template for REJECTED leave.
     */
    private String buildRejectedEmail(Users user, Users hr, LeaveRequest leave) {

        return """
<html>
<body style='font-family: Arial, sans-serif; background:#f7f7f7; padding:20px;'>
    <div style='background:#ffffff; border-radius:8px; padding:20px; max-width:600px; margin:auto;'>

        <h2 style='color:#C62828; margin-bottom:10px;'>Leave Request Rejected</h2>

        <p>Hi <strong>%s</strong>,</p>
        <p>Thank you for submitting your leave request.</p>
        <p>After review, we are unable to approve your request at this time.</p>

        <div style='background:#f8f8f8; padding:12px 16px; border-left:4px solid #C62828; margin:18px 0;'>
            <p style='margin:4px 0;'><strong>Leave Duration :</strong> %s to %s</p>
            <p style='margin:4px 0;'><strong>Reason Provided:</strong> %s</p>
            <p style='margin:4px 0;'><strong>Reviewed By :</strong> %s</p>
        </div>

        <p>If you have any questions, please feel free to contact the HR team.</p>

        <p style='margin-top:24px;'>
            Warm regards,<br/>
            <strong>%s</strong><br/>
            Human Resources<br/>
            Priacc Innovations
        </p>

        <!-- FOOTER WITH LOGO LEFT + COPYRIGHT RIGHT -->
        <table width='100%%' style='margin-top:30px;'>
            <tr>
                <td style='text-align:left;'>
                    <img src='cid:priaccLogo' alt='Priacc Innovations' style='width:140px;' />
                </td>
                <td style='text-align:right; font-size:12px; color:#777;'>
                    © Priacc Innovations — New Revolution in Software
                </td>
            </tr>
        </table>

    </div>
</body>
</html>
""".formatted(
                user.getFullName(),
                leave.getStartDate(),
                leave.getEndDate(),
                leave.getReason(),
                hr.getFullName(),
                hr.getFullName()
        );
    }


    public Map<String, Integer> leaveDatas(Integer userId) {
        return new HashMap<>();
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
    public int getApprovedLeaveDaysForCurrentCycle(Integer userId) {

        LocalDate today = LocalDate.now();

        LocalDate cycleStart = getCurrentCycleStart(today);
        LocalDate cycleEnd   = getCurrentCycleEnd(today);

        List<LeaveRequest> leaves =
                leaveRepo.findApprovedLeavesInRange(
                        userId, cycleStart, cycleEnd);

        int totalDays = 0;

        for (LeaveRequest leave : leaves) {

            LocalDate effectiveStart =
                    leave.getStartDate().isBefore(cycleStart)
                            ? cycleStart
                            : leave.getStartDate();

            LocalDate effectiveEnd =
                    leave.getEndDate().isAfter(cycleEnd)
                            ? cycleEnd
                            : leave.getEndDate();

            totalDays +=
                    (int) (effectiveEnd.toEpochDay()
                            - effectiveStart.toEpochDay() + 1);
        }

        return totalDays;
    }
    private LocalDate getCurrentCycleStart(LocalDate today) {
        if (today.getDayOfMonth() >= 24) {
            return today.withDayOfMonth(24);
        } else {
            return today.minusMonths(1).withDayOfMonth(24);
        }
    }

    private LocalDate getCurrentCycleEnd(LocalDate today) {
        if (today.getDayOfMonth() >= 24) {
            return today.plusMonths(1).withDayOfMonth(23);
        } else {
            return today.withDayOfMonth(23);
        }
    }
}
