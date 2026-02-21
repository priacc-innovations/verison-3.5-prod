package com.example.employee_service_mama.controller;

import com.example.employee_service_mama.model.Holiday;
import com.example.employee_service_mama.service.HolidayService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/holiday")
public class HolidayController {
    private final HolidayService holidayService;

    @GetMapping("/all")
    public ResponseEntity<List<Holiday>> getAllHolidays() {
        return ResponseEntity.ok(holidayService.getAllHolidays());
    }
}