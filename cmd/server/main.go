package main

import (
	"context"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"github.com/ukuvago/angelvault/internal/config"
	"github.com/ukuvago/angelvault/internal/database"
	"github.com/ukuvago/angelvault/internal/models"
	"github.com/ukuvago/angelvault/internal/routes"
	"gorm.io/gorm"
)

func main() {
	// Setup logging
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix
	log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to load configuration")
	}

	// Set log level based on environment
	if cfg.IsProduction() {
		zerolog.SetGlobalLevel(zerolog.InfoLevel)
	} else {
		zerolog.SetGlobalLevel(zerolog.DebugLevel)
	}

	log.Info().
		Str("environment", cfg.Environment).
		Str("port", cfg.Port).
		Msg("Starting AngelVault server")

	// Connect to database
	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to connect to database")
	}
	defer database.Close()

	// Run migrations (auto-migrate for development)
	if err := autoMigrate(db); err != nil {
		log.Fatal().Err(err).Msg("Failed to run migrations")
	}

	// Seed default data
	seedDefaultData(db)

	// Setup routes
	router := routes.NewRouter(cfg)
	engine := router.Setup()

	// Create HTTP server
	srv := &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      engine,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in goroutine
	go func() {
		log.Info().Str("addr", srv.Addr).Msg("Server listening")
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal().Err(err).Msg("Server failed")
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info().Msg("Shutting down server...")

	// Graceful shutdown with timeout
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal().Err(err).Msg("Server forced to shutdown")
	}

	log.Info().Msg("Server exited properly")
}

// autoMigrate runs GORM auto-migrations
func autoMigrate(db *gorm.DB) error {
	log.Info().Msg("Running database migrations...")
	
	return db.AutoMigrate(
		&models.User{},
		&models.InvestorProfile{},
		&models.Category{},
		&models.Project{},
		&models.TeamMember{},
		&models.ProjectImage{},
		&models.ProjectReadiness{},
		&models.NDA{},
		&models.ProjectNDAConfig{},
		&models.ProjectNDASignature{},
		&models.Payment{},
		&models.ProjectView{},
		&models.InvestmentOffer{},
		&models.TermSheet{},
		&models.PlatformCommission{},
		&models.MeetingRequest{},
		&models.Message{},
		&models.AuditLog{},
		&models.InvestorAccessLog{},
		&models.ProjectViewLog{},
	)
}

// seedDefaultData seeds initial data if not present
func seedDefaultData(db *gorm.DB) {
	log.Info().Msg("Checking seed data...")

	// Seed categories
	var categoryCount int64
	db.Model(&models.Category{}).Count(&categoryCount)
	
	if categoryCount == 0 {
		log.Info().Msg("Seeding default categories...")
		for i, cat := range models.DefaultCategories {
			cat.DisplayOrder = i
			if err := db.Create(&cat).Error; err != nil {
				log.Warn().Err(err).Str("category", cat.Name).Msg("Failed to seed category")
			}
		}
		log.Info().Int("count", len(models.DefaultCategories)).Msg("Categories seeded")
	}

	// Create admin user if not exists
	var adminCount int64
	db.Model(&models.User{}).Where("role = ?", models.RoleAdmin).Count(&adminCount)
	
	if adminCount == 0 {
		log.Info().Msg("Creating default admin user...")
		admin := &models.User{
			Email:        "admin@angelvault.io",
			FirstName:    "Admin",
			LastName:     "User",
			Role:         models.RoleAdmin,
			AuthProvider: models.AuthProviderEmail,
			EmailVerified: true,
			IsActive:     true,
		}
		
		// Generate secure random password in production, use changeme in dev
		admin.SetPassword("changeme123!")
		
		if err := db.Create(admin).Error; err != nil {
			log.Warn().Err(err).Msg("Failed to create admin user")
		} else {
			log.Warn().
				Str("email", admin.Email).
				Msg("Admin user created - CHANGE PASSWORD IMMEDIATELY")
		}
	}
}
