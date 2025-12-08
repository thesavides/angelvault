package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/ukuvago/angelvault/internal/config"
)

type rateLimiter struct {
	requests map[string]*clientInfo
	mu       sync.RWMutex
	limit    int
	window   time.Duration
}

type clientInfo struct {
	count     int
	resetTime time.Time
}

var limiter *rateLimiter

func initRateLimiter(cfg *config.Config) {
	limiter = &rateLimiter{
		requests: make(map[string]*clientInfo),
		limit:    cfg.RateLimitRequests,
		window:   cfg.RateLimitWindow,
	}

	// Cleanup goroutine
	go func() {
		ticker := time.NewTicker(time.Minute)
		for range ticker.C {
			limiter.cleanup()
		}
	}()
}

func (r *rateLimiter) cleanup() {
	r.mu.Lock()
	defer r.mu.Unlock()

	now := time.Now()
	for ip, info := range r.requests {
		if now.After(info.resetTime) {
			delete(r.requests, ip)
		}
	}
}

func (r *rateLimiter) allow(clientIP string) bool {
	r.mu.Lock()
	defer r.mu.Unlock()

	now := time.Now()
	info, exists := r.requests[clientIP]

	if !exists || now.After(info.resetTime) {
		r.requests[clientIP] = &clientInfo{
			count:     1,
			resetTime: now.Add(r.window),
		}
		return true
	}

	if info.count >= r.limit {
		return false
	}

	info.count++
	return true
}

// RateLimitMiddleware limits requests per IP
func RateLimitMiddleware(cfg *config.Config) gin.HandlerFunc {
	if limiter == nil {
		initRateLimiter(cfg)
	}

	return func(c *gin.Context) {
		clientIP := c.ClientIP()

		if !limiter.allow(clientIP) {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error":       "Rate limit exceeded",
				"retry_after": int(limiter.window.Seconds()),
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// StrictRateLimitMiddleware for sensitive endpoints (login, registration)
func StrictRateLimitMiddleware() gin.HandlerFunc {
	strictLimiter := &rateLimiter{
		requests: make(map[string]*clientInfo),
		limit:    10, // 10 requests per minute for auth endpoints
		window:   time.Minute,
	}

	return func(c *gin.Context) {
		clientIP := c.ClientIP()

		if !strictLimiter.allow(clientIP) {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error":       "Too many attempts. Please try again later.",
				"retry_after": 60,
			})
			c.Abort()
			return
		}

		c.Next()
	}
}
