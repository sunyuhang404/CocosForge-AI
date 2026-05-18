package com.gameforge.security;

import java.time.Instant;

public record JwtClaims(Long userId, String email, Instant issuedAt, Instant expiresAt) {}
