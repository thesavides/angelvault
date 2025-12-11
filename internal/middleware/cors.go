package middleware

import (
"os"
"strings"
"time"

"github.com/gin-contrib/cors"
"github.com/gin-gonic/gin"
"github.com/ukuvago/angelvault/internal/config"
)

// CORSMiddleware returns appropriate CORS configuration
// Uses gin-contrib/cors which properly handles OPTIONS preflight requests
func CORSMiddleware(cfg *config.Config) gin.HandlerFunc {
allowedOrigins := []string{
"https://angelvault-frontend-f6n6l7ykta-ez.a.run.app",
"https://angelvault.io",
"https://www.angelvault.io",
"https://app.angelvault.io",
"http://localhost:3000",
"http://localhost:5173",
"http://localhost:8080",
"http://127.0.0.1:3000",
"http://127.0.0.1:5173",
"http://127.0.0.1:8080",
}

// Add any additional origins from environment variable
if corsOrigins := os.Getenv("CORS_ORIGINS"); corsOrigins != "" {
for _, origin := range strings.Split(corsOrigins, ",") {
origin = strings.TrimSpace(origin)
if origin != "" {
allowedOrigins = append(allowedOrigins, origin)
}
}
}

// Let gin-contrib/cors handle everything including OPTIONS preflight
return cors.New(cors.Config{
AllowOrigins:     allowedOrigins,
AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"},
AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With"},
ExposeHeaders:    []string{"Content-Length", "Content-Type"},
AllowCredentials: true,
MaxAge:           12 * time.Hour,
})
}
