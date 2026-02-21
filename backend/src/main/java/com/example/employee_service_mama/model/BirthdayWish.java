package com.example.employee_service_mama.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "birthday_wishes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BirthdayWish {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "from_user_id", nullable = false)
    private Long fromUserId;

    @Column(name = "to_user_id", nullable = false)
    private Long toUserId;

    @Column(nullable = false, length = 500)
    private String message;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;
}
