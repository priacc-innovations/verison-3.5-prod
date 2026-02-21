package com.example.employee_service_mama.service;

import com.example.employee_service_mama.dto.WishRequest;
import com.example.employee_service_mama.model.BirthdayWish;
import com.example.employee_service_mama.repository.WishRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WishService {

    private final WishRepository wishRepository;

    public void sendWish(WishRequest request) {

        if (request.getFromUserId() == null || request.getToUserId() == null) {
            throw new IllegalArgumentException("User IDs must not be null");
        }

        BirthdayWish wish = BirthdayWish.builder()
                .fromUserId(request.getFromUserId())
                .toUserId(request.getToUserId())
                .message(request.getMessage())
                .sentAt(LocalDateTime.now())
                .build();

        wishRepository.save(wish);
    }

    public List<BirthdayWish> getWishesForUser(Long userId) {
        return wishRepository.findByToUserId(userId);
    }

}
