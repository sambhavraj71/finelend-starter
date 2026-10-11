package com.finlend.repository;

import com.finlend.entity.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import com.finlend.entity.Role;
import java.util.Optional;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {
    long countByRole(Role role);
    Optional<AppUser> findByEmail(String email);

    boolean existsByEmail(String email);
}