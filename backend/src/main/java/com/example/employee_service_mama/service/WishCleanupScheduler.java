package com.example.employee_service_mama.service;

import com.example.employee_service_mama.repository.WishRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class WishCleanupScheduler {

    private final WishRepository wishRepository;



    @Scheduled(cron = "0 0 0 * * ?", zone = "Asia/Kolkata")
    public void deleteOldWishes() {
        LocalDateTime startOfToday =
                LocalDateTime.now()
                        .toLocalDate()
                        .atStartOfDay();

        wishRepository.deleteBySentAtBefore(startOfToday);
    }



}
