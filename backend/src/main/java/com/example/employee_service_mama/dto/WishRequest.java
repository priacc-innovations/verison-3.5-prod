package com.example.employee_service_mama.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class WishRequest {
    private Long fromUserId;
    private Long toUserId;
    private String message;
}
