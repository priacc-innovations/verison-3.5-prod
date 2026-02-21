package com.example.employee_service_mama.controller;

import com.example.employee_service_mama.model.Announcement;
import com.example.employee_service_mama.service.AnnouncementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(
        origins = {
                "https://teamhub.in",
                "http://teamhub.in",
                "http://teamhub-ALB-680655485.ap-south-1.elb.amazonaws.com",
                "http://15.206.26.130:80"
        },
        allowCredentials = "true"
)@RequestMapping("api/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementService announcementService;

    @PostMapping("/create/{userId}")
    public ResponseEntity<Announcement> createAnnouncement(@RequestBody Announcement announcement,@PathVariable Integer userId) {
        Announcement saved = announcementService.saveAnnouncement(announcement,userId);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/recent")
    public ResponseEntity<List<Announcement>> getRecentAnnouncements() {
        List<Announcement> announcements = announcementService.getRecentAnnouncements();
        return ResponseEntity.ok(announcements);
    }
}





