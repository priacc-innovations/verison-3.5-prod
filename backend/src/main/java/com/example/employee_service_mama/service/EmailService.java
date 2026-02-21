package com.example.employee_service_mama.service;

import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    // CID name used inside HTML template <img src="cid:priaccLogo">
    private static final String LOGO_CONTENT_ID = "priaccLogo";

    // MUST match: src/main/resources/static/priacc_logo.png
    private static final String LOGO_CLASSPATH = "static/priacc_logo.png";

    /**
     * Sends an HTML email with an inline logo if available.
     * This is fully production-ready and works after deploy too,
     * because ClassPathResource loads files packaged inside the JAR.
     */
    public void sendHtmlEmail(String to, String subject, String htmlBody) {
        System.out.println("📧 Preparing email → " + to);

        try {
            MimeMessage message = mailSender.createMimeMessage();

            // true = multipart message (needed for inline images)
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true); // true = HTML

            System.out.println("📎 Loading inline logo...");
            Resource logoResource = new ClassPathResource(LOGO_CLASSPATH);

            if (logoResource.exists()) {
                System.out.println("✅ Logo found. Attaching inline as CID...");
                helper.addInline(LOGO_CONTENT_ID, logoResource);
            } else {
                System.out.println("⚠️ Logo NOT found at: " + LOGO_CLASSPATH);
            }

            System.out.println("📨 Sending email...");
            mailSender.send(message);

            System.out.println("✅ Email sent successfully!");

        } catch (Exception e) {
            System.out.println("❌ Failed to send email: " + e.getMessage());
            throw new RuntimeException("Email sending failed", e);
        }
    }
}
