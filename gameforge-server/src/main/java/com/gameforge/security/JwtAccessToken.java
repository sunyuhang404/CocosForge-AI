package com.gameforge.security;

import java.time.Instant;

public record JwtAccessToken(String token, Instant expiresAt) {}
