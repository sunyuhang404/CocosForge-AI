package com.gameforge.security;

import java.time.Instant;

public record RefreshToken(String token, Instant expiresAt) {}
