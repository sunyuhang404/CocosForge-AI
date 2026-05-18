package com.gameforge.controller;

import com.gameforge.security.CurrentUser;
import com.gameforge.security.CurrentUserContext;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public abstract class BaseController {

  protected final Logger log = LoggerFactory.getLogger(getClass());

  protected CurrentUser getCurrentUser() {
    return CurrentUserContext.require();
  }

  protected Optional<CurrentUser> getOptionalCurrentUser() {
    return CurrentUserContext.get();
  }
}
