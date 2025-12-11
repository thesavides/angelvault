package services

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/rs/zerolog/log"
	"github.com/ukuvago/angelvault/internal/config"
	"github.com/ukuvago/angelvault/internal/database"
	"github.com/ukuvago/angelvault/internal/middleware"
	"github.com/ukuvago/angelvault/internal/models"
)

type AuthService struct {
	config *config.Config
}

func NewAuthService(cfg *config.Config) *AuthService {
	return &AuthService{config: cfg}
}

// RegisterRequest represents registration input
type RegisterRequest struct {
	Email       string          `json:"email" binding:"required,email"`
	Password    string          `json:"password" binding:"required,min=8"`
	FirstName   string          `json:"first_name" binding:"required"`
	LastName    string          `json:"last_name" binding:"required"`
	CompanyName string          `json:"company_name"`
	Role        models.UserRole `json:"role" binding:"required,oneof=investor developer"`
}

// LoginRequest represents login input
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// AuthResponse is returned after successful auth
type AuthResponse struct {
	Token string              `json:"token"`
	User  models.UserResponse `json:"user"`
}

// Register creates a new user account
func (s *AuthService) Register(req *RegisterRequest) (*AuthResponse, error) {
	db := database.GetDB()

	// Normalize email to lowercase
	normalizedEmail := strings.ToLower(strings.TrimSpace(req.Email))

	// Check if email already exists (case-insensitive)
	var existing models.User
	if err := db.Where("LOWER(email) = ?", normalizedEmail).First(&existing).Error; err == nil {
		return nil, errors.New("email already registered")
	}

	// Create user with normalized email
	user := &models.User{
		Email:        normalizedEmail,
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		CompanyName:  req.CompanyName,
		Role:         req.Role,
		AuthProvider: models.AuthProviderEmail,
	}

	if err := user.SetPassword(req.Password); err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Generate email verification token
	user.EmailVerifyToken = generateToken()

	if err := db.Create(user).Error; err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	// Create investor profile if investor
	if user.Role == models.RoleInvestor {
		profile := &models.InvestorProfile{
			UserID: user.ID,
		}
		if err := db.Create(profile).Error; err != nil {
			log.Warn().Err(err).Msg("Failed to create investor profile")
		}
	}

	// Generate JWT
	token, err := s.GenerateToken(user)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	return &AuthResponse{
		Token: token,
		User:  user.ToResponse(),
	}, nil
}

// Login authenticates a user
func (s *AuthService) Login(req *LoginRequest) (*AuthResponse, error) {
	db := database.GetDB()

	// Normalize email to lowercase for case-insensitive lookup
	normalizedEmail := strings.ToLower(strings.TrimSpace(req.Email))

	var user models.User
	if err := db.Where("LOWER(email) = ?", normalizedEmail).First(&user).Error; err != nil {
		return nil, errors.New("invalid email or password")
	}

	if !user.IsActive {
		return nil, errors.New("account is disabled")
	}

	if user.AuthProvider != models.AuthProviderEmail {
		return nil, fmt.Errorf("please login with %s", user.AuthProvider)
	}

	if !user.CheckPassword(req.Password) {
		return nil, errors.New("invalid email or password")
	}

	// Update last login
	now := time.Now()
	user.LastLoginAt = &now
	db.Save(&user)

	// Generate JWT
	token, err := s.GenerateToken(&user)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	return &AuthResponse{
		Token: token,
		User:  user.ToResponse(),
	}, nil
}

// LoginWithOAuth authenticates or creates a user via OAuth
func (s *AuthService) LoginWithOAuth(info *OAuthUserInfo, role models.UserRole) (*AuthResponse, error) {
	db := database.GetDB()

	// Normalize email to lowercase
	normalizedEmail := strings.ToLower(strings.TrimSpace(info.Email))

	var user models.User

	// Try to find existing user by OAuth ID
	err := db.Where("oauth_id = ? AND auth_provider = ?", info.ID, info.Provider).First(&user).Error
	
	if err != nil {
		// Try to find by email (case-insensitive)
		err = db.Where("LOWER(email) = ?", normalizedEmail).First(&user).Error
		
		if err != nil {
			// Create new user with normalized email
			user = models.User{
				Email:           normalizedEmail,
				FirstName:       info.FirstName,
				LastName:        info.LastName,
				AuthProvider:    info.Provider,
				OAuthID:         info.ID,
				ProfileImageURL: info.ProfileImage,
				EmailVerified:   info.EmailVerified,
				Role:            role,
				IsActive:        true,
			}

			if err := db.Create(&user).Error; err != nil {
				return nil, fmt.Errorf("failed to create user: %w", err)
			}

			// Create investor profile if investor
			if role == models.RoleInvestor {
				profile := &models.InvestorProfile{
					UserID: user.ID,
				}
				db.Create(profile)
			}
		} else {
			// User exists with this email but different auth provider
			// Link the OAuth account
			user.OAuthID = info.ID
			user.AuthProvider = info.Provider
			if user.ProfileImageURL == "" {
				user.ProfileImageURL = info.ProfileImage
			}
			if !user.EmailVerified && info.EmailVerified {
				user.EmailVerified = true
			}
			db.Save(&user)
		}
	}

	if !user.IsActive {
		return nil, errors.New("account is disabled")
	}

	// Update last login
	now := time.Now()
	user.LastLoginAt = &now
	db.Save(&user)

	// Generate JWT
	token, err := s.GenerateToken(&user)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	return &AuthResponse{
		Token: token,
		User:  user.ToResponse(),
	}, nil
}

// GenerateToken creates a JWT for the user
func (s *AuthService) GenerateToken(user *models.User) (string, error) {
	expirationTime := time.Now().Add(time.Duration(s.config.JWTExpirationHours) * time.Hour)

	claims := &middleware.Claims{
		UserID: user.ID,
		Email:  user.Email,
		Role:   user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "angelvault",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.config.JWTSecret))
}

// GetUserByID retrieves a user by ID
func (s *AuthService) GetUserByID(id uuid.UUID) (*models.User, error) {
	db := database.GetDB()
	
	var user models.User
	if err := db.Preload("InvestorProfile").First(&user, "id = ?", id).Error; err != nil {
		return nil, errors.New("user not found")
	}
	
	return &user, nil
}

// UpdateProfile updates user profile information
func (s *AuthService) UpdateProfile(userID uuid.UUID, firstName, lastName, companyName string) (*models.User, error) {
	db := database.GetDB()
	
	var user models.User
	if err := db.First(&user, "id = ?", userID).Error; err != nil {
		return nil, errors.New("user not found")
	}
	
	user.FirstName = firstName
	user.LastName = lastName
	user.CompanyName = companyName
	
	if err := db.Save(&user).Error; err != nil {
		return nil, fmt.Errorf("failed to update profile: %w", err)
	}
	
	return &user, nil
}

// GetInvestorProfile retrieves investor-specific profile information
func (s *AuthService) GetInvestorProfile(userID uuid.UUID) (*models.InvestorProfile, error) {
	db := database.GetDB()
	
	var profile models.InvestorProfile
	if err := db.Where("user_id = ?", userID).First(&profile).Error; err != nil {
		return nil, errors.New("investor profile not found")
	}
	
	return &profile, nil
}

// UpdateInvestorProfile updates investor-specific profile information
func (s *AuthService) UpdateInvestorProfile(userID uuid.UUID, profile *models.InvestorProfile) (*models.InvestorProfile, error) {
	db := database.GetDB()
	
	// Verify user is an investor
	var user models.User
	if err := db.First(&user, "id = ? AND role = ?", userID, models.RoleInvestor).Error; err != nil {
		return nil, errors.New("investor not found")
	}
	
	// Get or create investor profile
	var existingProfile models.InvestorProfile
	err := db.Where("user_id = ?", userID).First(&existingProfile).Error
	
	if err != nil {
		// Create new profile
		profile.UserID = userID
		if err := db.Create(profile).Error; err != nil {
			return nil, fmt.Errorf("failed to create investor profile: %w", err)
		}
		return profile, nil
	}
	
	// Update existing profile
	existingProfile.InvestorType = profile.InvestorType
	existingProfile.Bio = profile.Bio
	existingProfile.LinkedInURL = profile.LinkedInURL
	existingProfile.WebsiteURL = profile.WebsiteURL
	existingProfile.ProfileImageURL = profile.ProfileImageURL
	existingProfile.MinCheckSize = profile.MinCheckSize
	existingProfile.MaxCheckSize = profile.MaxCheckSize
	existingProfile.FocusAreas = profile.FocusAreas
	existingProfile.PreferredStages = profile.PreferredStages
	
	// Institutional details
	existingProfile.CompanyLegalName = profile.CompanyLegalName
	existingProfile.CompanyRegistration = profile.CompanyRegistration
	existingProfile.CompanyJurisdiction = profile.CompanyJurisdiction
	existingProfile.CompanyAddress = profile.CompanyAddress
	existingProfile.CompanyCity = profile.CompanyCity
	existingProfile.CompanyState = profile.CompanyState
	existingProfile.CompanyPostalCode = profile.CompanyPostalCode
	existingProfile.CompanyCountry = profile.CompanyCountry
	existingProfile.TaxID = profile.TaxID
	
	// Signatory details
	existingProfile.SignatoryName = profile.SignatoryName
	existingProfile.SignatoryTitle = profile.SignatoryTitle
	existingProfile.SignatoryEmail = profile.SignatoryEmail
	
	// Privacy
	existingProfile.IsProfilePublic = profile.IsProfilePublic
	
	if err := db.Save(&existingProfile).Error; err != nil {
		return nil, fmt.Errorf("failed to update investor profile: %w", err)
	}
	
	return &existingProfile, nil
}

// ChangePassword changes user's password
func (s *AuthService) ChangePassword(userID uuid.UUID, currentPassword, newPassword string) error {
	db := database.GetDB()
	
	var user models.User
	if err := db.First(&user, "id = ?", userID).Error; err != nil {
		return errors.New("user not found")
	}
	
	if user.AuthProvider != models.AuthProviderEmail {
		return errors.New("cannot change password for OAuth accounts")
	}
	
	if !user.CheckPassword(currentPassword) {
		return errors.New("current password is incorrect")
	}
	
	if err := user.SetPassword(newPassword); err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}
	
	return db.Save(&user).Error
}

// RequestPasswordReset initiates password reset
func (s *AuthService) RequestPasswordReset(email string) (string, error) {
	db := database.GetDB()
	
	// Normalize email for case-insensitive lookup
	normalizedEmail := strings.ToLower(strings.TrimSpace(email))
	
	var user models.User
	if err := db.Where("LOWER(email) = ?", normalizedEmail).First(&user).Error; err != nil {
		// Don't reveal if email exists
		return "", nil
	}
	
	if user.AuthProvider != models.AuthProviderEmail {
		return "", nil
	}
	
	token := generateToken()
	expires := time.Now().Add(time.Hour)
	
	user.PasswordResetToken = token
	user.PasswordResetExpires = &expires
	
	if err := db.Save(&user).Error; err != nil {
		return "", fmt.Errorf("failed to save reset token: %w", err)
	}
	
	return token, nil
}

// ResetPassword completes password reset
func (s *AuthService) ResetPassword(token, newPassword string) error {
	db := database.GetDB()
	
	var user models.User
	if err := db.Where("password_reset_token = ?", token).First(&user).Error; err != nil {
		return errors.New("invalid or expired reset token")
	}
	
	if user.PasswordResetExpires == nil || time.Now().After(*user.PasswordResetExpires) {
		return errors.New("reset token has expired")
	}
	
	if err := user.SetPassword(newPassword); err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}
	
	user.PasswordResetToken = ""
	user.PasswordResetExpires = nil
	
	return db.Save(&user).Error
}

// VerifyEmail verifies user's email
func (s *AuthService) VerifyEmail(token string) error {
	db := database.GetDB()
	
	var user models.User
	if err := db.Where("email_verify_token = ?", token).First(&user).Error; err != nil {
		return errors.New("invalid verification token")
	}
	
	user.EmailVerified = true
	user.EmailVerifyToken = ""
	
	return db.Save(&user).Error
}

// Helper functions
func generateToken() string {
	bytes := make([]byte, 32)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}
