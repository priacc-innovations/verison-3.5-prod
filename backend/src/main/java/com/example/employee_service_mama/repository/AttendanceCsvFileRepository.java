package com.example.employee_service_mama.repository;

import com.example.employee_service_mama.model.AttendanceCsvFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AttendanceCsvFileRepository extends JpaRepository<AttendanceCsvFile, Integer> {

    List<AttendanceCsvFile> findByDate(String date); // add by went to check duplicates
    @Query("""
    SELECT a
    FROM AttendanceCsvFile a
    WHERE a.employeeId = :employeeId
      AND a.date = :date
""")
    Optional<AttendanceCsvFile> findByEmployeeIdAndDate(
            @Param("employeeId") String employeeId,
            @Param("date") String date
    );

}
