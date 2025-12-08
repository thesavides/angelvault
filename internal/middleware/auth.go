package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/ukuvago/angelvault/internal/config"
	"github.com/ukuvago/angelvault/internal/database"
	"github.com/ukuvago/angelvault/internal/models"
)

type contextKey string

const (
	UserIDKey   contextKey = "user_id"
	UserRoleKey contextKey = "user_role"
	UserKey     contextKey = "user"
)

type Claims struct {
	UserID uuid.UUID       `json:"user_id"`
	Email  string          `json:"email"`
	Role   models.UserRole `json:"role"`
	jwt.RegisteredClaims
}

// AuthMiddleware validates JWT tokens
func AuthMiddleware(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header required"})
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Bearer token required"})
			c.Abort()
			return
		}

		claims := &Claims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return []byte(cfg.JWTSecret), nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
			c.Abort()
			return
		}

		// Store claims in context
		c.Set(string(UserIDKey), claims.UserID)
		c.Set(string(UserRoleKey), claims.Role)

		c.Next()
	}
}

// OptionalAuthMiddleware parses JWT if present but doesn't require it
func OptionalAuthMiddleware(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.Next()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			c.Next()
			return
		}

		claims := &Claims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return []byte(cfg.JWTSecret), nil
		})

		if err == nil && token.Valid {
			c.Set(string(UserIDKey), claims.UserID)
			c.Set(string(UserRoleKey), claims.Role)
		}

		c.Next()
	}
}

// RequireRole checks if the user has the required role
func RequireRole(roles ...models.UserRole) gin.HandlerFunc {
	return func(c *gin.Context) {
		roleVal, exists := c.Get(string(UserRoleKey))
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
			c.Abort()
			return
		}

		userRole := roleVal.(models.UserRole)
		for _, role := range roles {
			if userRole == role {
				c.Next()
				return
			}
		}

		c.JSON(http.StatusForbidden, gin.H{"error": "Insufficient permissions"})
		c.Abort()
	}
}

// RequireInvestor checks if the user is an investor
func RequireInvestor() gin.HandlerFunc {
	return RequireRole(models.RoleInvestor, models.RoleAdmin)
}

// RequireDeveloper checks if the user is a developer
func RequireDeveloper() gin.HandlerFunc {
	return RequireRole(models.RoleDeveloper, models.RoleAdmin)
}

// RequireAdmin checks if the user is an admin
func RequireAdmin() gin.HandlerFunc {
	return RequireRole(models.RoleAdmin)
}

// LoadUser middleware loads the full user object
func LoadUser() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := GetUserID(c)
		if !exists {
			c.Next()
			return
		}

		db := database.GetDB()
		var user models.User
		if err := db.First(&user, "id = ?", userID).Error; err != nil {
			c.Next()
			return
		}

		c.Set(string(UserKey), &user)
		c.Next()
	}
}

// Helper functions to get values from context
func GetUserID(c *gin.Context) (uuid.UUID, bool) {
	val, exists := c.Get(string(UserIDKey))
	if !exists {
		return uuid.Nil, false
	}
	return val.(uuid.UUID), true
}

func GetUserRole(c *gin.Context) (models.UserRole, bool) {
	val, exists := c.Get(string(UserRoleKey))
	if !exists {
		return "", false
	}
	return val.(models.UserRole), true
}

func GetUser(c *gin.Context) (*models.User, bool) {
	val, exists := c.Get(string(UserKey))
	if !exists {
		return nil, false
	}
	return val.(*models.User), true
}
