package com.example.employee_service_mama.service;

import com.example.employee_service_mama.model.Holiday;
import com.example.employee_service_mama.repository.HolidayRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class HolidayService {
    private final HolidayRepository holidayRepository;

    public List<Holiday> getAllHolidays() {
        return holidayRepository.findAllByOrderByDateAsc();
    }
}