package com.gameforge.service.impl;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.gameforge.mapper.UserMapper;
import com.gameforge.model.entity.User;
import com.gameforge.service.UserService;
import jakarta.annotation.Resource;
import java.util.Optional;
import org.springframework.stereotype.Service;

@Service
public class UserServiceImpl implements UserService {

  @Resource
  private UserMapper userMapper;

  @Override
  public Optional<User> findById(Long id) {
    return Optional.ofNullable(userMapper.selectById(id));
  }

  @Override
  public Optional<User> findByEmail(String email) {
    User user =
        userMapper.selectOne(Wrappers.<User>lambdaQuery().eq(User::getEmail, email));
    return Optional.ofNullable(user);
  }

  @Override
  public User create(String email, String passwordHash, String displayName) {
    User user =
        new User().setEmail(email).setPasswordHash(passwordHash).setDisplayName(displayName);
    userMapper.insert(user);
    return userMapper.selectById(user.getId());
  }
}
