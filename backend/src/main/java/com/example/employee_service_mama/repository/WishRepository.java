package com.example.employee_service_mama.repository;

import com.example.employee_service_mama.model.BirthdayWish;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface WishRepository extends JpaRepository<BirthdayWish, Long> {
    List<BirthdayWish> findByToUserId(Long toUserId);
    // 🔥 DELETE wishes older than 24 hours
    void deleteBySentAtBefore(LocalDateTime time);
}

