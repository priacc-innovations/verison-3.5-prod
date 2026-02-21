package com.example.employee_service_mama.repository;

import com.example.employee_service_mama.dto.WalletResponse;
import com.example.employee_service_mama.model.Wallet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface WalletRepository extends JpaRepository<Wallet, Integer> {

    // ✔ Current active month only (cycle_end IS NULL)

    @Query("SELECT w.monthlySalary FROM Wallet w WHERE w.user.id = :userId AND w.cycleEnd IS NULL")
    Double monthsalary(@Param("userId") Integer userId);

    @Query("SELECT w.dailyRate FROM Wallet w WHERE w.user.id = :userId AND w.cycleEnd IS NULL")
    Double dailyrate(@Param("userId") Integer userId);

    @Query("SELECT SUM(w.monthlySalary) FROM Wallet w WHERE w.cycleEnd IS NULL")
    Double totalmonthsalary();

    @Query("SELECT SUM(w.currentMonthEarned) FROM Wallet w WHERE w.cycleEnd IS NULL")
    Double currentMonthEarned();

    @Query("SELECT SUM(w.deduction) FROM Wallet w WHERE w.cycleEnd IS NULL")
    Double totaldeduction();

    @Query("""
           SELECT w FROM Wallet w
           WHERE w.user.id = :userId AND w.cycleEnd IS NULL
           """)
    Optional<Wallet> findActiveWalletForUser(@Param("userId") Integer userId);

    @Query("SELECT w.deduction FROM Wallet w WHERE w.user.id = :userId AND w.cycleEnd IS NULL")
    Double findDeductionByUserId(Integer userId);

    @Query("""
           SELECT new com.example.employee_service_mama.dto.WalletResponse(
               u.id,
               w.empid,
               u.fullName,
               u.role,
               w.monthlySalary,
               w.dailyRate,
               w.currentMonthEarned,
               COALESCE(w.deduction, 0)
           )
           FROM Wallet w
           JOIN w.user u
           WHERE w.cycleEnd IS NULL
           """)
    List<WalletResponse> findAllAsResponse();

    Optional<Wallet> findByEmpid(String empid);

    @Query("""
        SELECT w FROM Wallet w
        WHERE w.user.id = :userId
        AND :date BETWEEN w.cycleStart AND COALESCE(w.cycleEnd, CURRENT_DATE)
       """)
    Optional<Wallet> findWalletRowByDate(@Param("userId") Integer userId,
                                         @Param("date") LocalDate date);


    @Query("""
        SELECT w FROM Wallet w
        WHERE w.user.id = :userId
        AND w.cycleStart = :start
        AND COALESCE(w.cycleEnd, :end) = :end
       """)
    Optional<Wallet> findWalletInRange(@Param("userId") Integer userId,
                                       @Param("start") LocalDate cycleStart,
                                       @Param("end") LocalDate cycleEnd);


    @Query("""
        SELECT w FROM Wallet w
        WHERE w.user.id = :userId
        AND YEAR(w.cycleStart) = :year
        ORDER BY w.cycleStart DESC
        LIMIT 1
       """)
    Optional<Wallet> findLatestWalletForYear(@Param("userId") Integer userId,
                                             @Param("year") Integer year);


    @Query("""
    SELECT w FROM Wallet w
    WHERE w.cycleStart = :cycleStart
      AND (w.cycleEnd IS NULL OR w.cycleEnd = :cycleEnd)
""")
    List<Wallet> findWalletsInRange(
            @Param("cycleStart") LocalDate cycleStart,
            @Param("cycleEnd") LocalDate cycleEnd
    );
    @Query("""
    SELECT w FROM Wallet w
    JOIN FETCH w.user
""")
    List<Wallet> findAllWithUser();


}
