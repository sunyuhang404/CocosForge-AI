package com.gameforge.service;

import com.gameforge.model.entity.User;
import java.util.Optional;

public interface UserService {

  Optional<User> findByEmail(String email);

  User create(String email, String passwordHash, String displayName);
}
