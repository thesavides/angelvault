package middleware

import (
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/ukuvago/angelvault/internal/config"
)

// CORSMiddleware returns appropriate CORS configuration
func CORSMiddleware(cfg *config.Config) gin.HandlerFunc {
	corsConfig := cors.Config{
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With"},
		ExposeHeaders:    []string{"Content-Length", "Content-Type"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}

	if cfg.IsProduction() {
		// In production, only allow specific origins
		corsConfig.AllowOrigins = []string{
			cfg.BaseURL,
			"https://angelvault.io",
			"https://www.angelvault.io",
			"https://app.angelvault.io",
		}
	} else {
		// In development, allow localhost origins
		corsConfig.AllowOrigins = []string{
			"http://localhost:3000",
			"http://localhost:8080",
			"http://127.0.0.1:3000",
			"http://127.0.0.1:8080",
		}
		// Or allow all for easier development
		corsConfig.AllowAllOrigins = true
	}

	return cors.New(corsConfig)
}
