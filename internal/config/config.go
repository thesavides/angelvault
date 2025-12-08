package config

import (
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
	"github.com/rs/zerolog/log"
)

type Config struct {
	// Server
	Environment string
	Port        string
	BaseURL     string

	// Database
	DatabaseURL string

	// JWT
	JWTSecret          string
	JWTExpirationHours int

	// OAuth Providers
	GoogleClientID     string
	GoogleClientSecret string
	GoogleRedirectURL  string

	AppleClientID     string
	AppleTeamID       string
	AppleKeyID        string
	ApplePrivateKey   string
	AppleRedirectURL  string

	LinkedInClientID     string
	LinkedInClientSecret string
	LinkedInRedirectURL  string

	// Stripe
	StripeSecretKey      string
	StripePublishableKey string
	StripeWebhookSecret  string

	// Payment Config
	ViewFeeAmount   int64  // Amount in cents
	ViewFeeCurrency string
	MaxProjectViews int
	
	// Commission Config
	CommissionRate float64 // Platform commission rate (e.g., 0.02 for 2%)

	// Email (SendGrid or similar)
	SMTPHost     string
	SMTPPort     int
	SMTPUser     string
	SMTPPassword string
	FromEmail    string
	FromName     string

	// Cloud Storage (GCS)
	GCSBucket          string
	GCSCredentialsFile string

	// NDA Config
	NDAValidityYears int

	// Rate Limiting
	RateLimitRequests int
	RateLimitWindow   time.Duration
}

func Load() (*Config, error) {
	// Load .env file if it exists (development)
	if err := godotenv.Load(); err != nil {
		log.Debug().Msg("No .env file found, using environment variables")
	}

	cfg := &Config{
		// Server
		Environment: getEnv("ENVIRONMENT", "development"),
		Port:        getEnv("PORT", "8080"),
		BaseURL:     getEnv("BASE_URL", "http://localhost:8080"),

		// Database
		DatabaseURL: mustGetEnv("DATABASE_URL"),

		// JWT
		JWTSecret:          mustGetEnv("JWT_SECRET"),
		JWTExpirationHours: getEnvInt("JWT_EXPIRATION_HOURS", 72),

		// OAuth - Google
		GoogleClientID:     getEnv("GOOGLE_CLIENT_ID", ""),
		GoogleClientSecret: getEnv("GOOGLE_CLIENT_SECRET", ""),
		GoogleRedirectURL:  getEnv("GOOGLE_REDIRECT_URL", ""),

		// OAuth - Apple
		AppleClientID:    getEnv("APPLE_CLIENT_ID", ""),
		AppleTeamID:      getEnv("APPLE_TEAM_ID", ""),
		AppleKeyID:       getEnv("APPLE_KEY_ID", ""),
		ApplePrivateKey:  getEnv("APPLE_PRIVATE_KEY", ""),
		AppleRedirectURL: getEnv("APPLE_REDIRECT_URL", ""),

		// OAuth - LinkedIn
		LinkedInClientID:     getEnv("LINKEDIN_CLIENT_ID", ""),
		LinkedInClientSecret: getEnv("LINKEDIN_CLIENT_SECRET", ""),
		LinkedInRedirectURL:  getEnv("LINKEDIN_REDIRECT_URL", ""),

		// Stripe
		StripeSecretKey:      getEnv("STRIPE_SECRET_KEY", ""),
		StripePublishableKey: getEnv("STRIPE_PUBLISHABLE_KEY", ""),
		StripeWebhookSecret:  getEnv("STRIPE_WEBHOOK_SECRET", ""),

		// Payment Config
		ViewFeeAmount:   getEnvInt64("VIEW_FEE_AMOUNT", 50000), // $500.00
		ViewFeeCurrency: getEnv("VIEW_FEE_CURRENCY", "usd"),
		MaxProjectViews: getEnvInt("MAX_PROJECT_VIEWS", 5),
		
		// Commission Config
		CommissionRate:  getEnvFloat("COMMISSION_RATE", 0.02), // 2% default

		// Email
		SMTPHost:     getEnv("SMTP_HOST", ""),
		SMTPPort:     getEnvInt("SMTP_PORT", 587),
		SMTPUser:     getEnv("SMTP_USER", ""),
		SMTPPassword: getEnv("SMTP_PASSWORD", ""),
		FromEmail:    getEnv("FROM_EMAIL", "noreply@angelvault.io"),
		FromName:     getEnv("FROM_NAME", "AngelVault"),

		// Cloud Storage
		GCSBucket:          getEnv("GCS_BUCKET", ""),
		GCSCredentialsFile: getEnv("GCS_CREDENTIALS_FILE", ""),

		// NDA
		NDAValidityYears: getEnvInt("NDA_VALIDITY_YEARS", 2),

		// Rate Limiting
		RateLimitRequests: getEnvInt("RATE_LIMIT_REQUESTS", 100),
		RateLimitWindow:   time.Duration(getEnvInt("RATE_LIMIT_WINDOW_SECONDS", 60)) * time.Second,
	}

	// Validate critical configuration
	if err := cfg.Validate(); err != nil {
		return nil, err
	}

	return cfg, nil
}

func (c *Config) Validate() error {
	if c.Environment == "production" {
		if c.JWTSecret == "changeme" || len(c.JWTSecret) < 32 {
			return fmt.Errorf("JWT_SECRET must be at least 32 characters in production")
		}
		if c.StripeSecretKey == "" {
			return fmt.Errorf("STRIPE_SECRET_KEY is required in production")
		}
	}
	return nil
}

func (c *Config) IsProduction() bool {
	return c.Environment == "production"
}

func (c *Config) IsDevelopment() bool {
	return c.Environment == "development"
}

// Helper functions
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func mustGetEnv(key string) string {
	value := os.Getenv(key)
	if value == "" {
		log.Fatal().Msgf("Required environment variable %s is not set", key)
	}
	return value
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intVal, err := strconv.Atoi(value); err == nil {
			return intVal
		}
	}
	return defaultValue
}

func getEnvInt64(key string, defaultValue int64) int64 {
	if value := os.Getenv(key); value != "" {
		if intVal, err := strconv.ParseInt(value, 10, 64); err == nil {
			return intVal
		}
	}
	return defaultValue
}

func getEnvFloat(key string, defaultValue float64) float64 {
	if value := os.Getenv(key); value != "" {
		if floatVal, err := strconv.ParseFloat(value, 64); err == nil {
			return floatVal
		}
	}
	return defaultValue
}
