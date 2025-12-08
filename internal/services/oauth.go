package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/ukuvago/angelvault/internal/config"
	"github.com/ukuvago/angelvault/internal/models"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

type OAuthService struct {
	config         *config.Config
	googleConfig   *oauth2.Config
	linkedinConfig *oauth2.Config
}

func NewOAuthService(cfg *config.Config) *OAuthService {
	svc := &OAuthService{config: cfg}

	// Configure Google OAuth
	if cfg.GoogleClientID != "" {
		svc.googleConfig = &oauth2.Config{
			ClientID:     cfg.GoogleClientID,
			ClientSecret: cfg.GoogleClientSecret,
			RedirectURL:  cfg.GoogleRedirectURL,
			Scopes: []string{
				"https://www.googleapis.com/auth/userinfo.email",
				"https://www.googleapis.com/auth/userinfo.profile",
			},
			Endpoint: google.Endpoint,
		}
	}

	// Configure LinkedIn OAuth
	if cfg.LinkedInClientID != "" {
		svc.linkedinConfig = &oauth2.Config{
			ClientID:     cfg.LinkedInClientID,
			ClientSecret: cfg.LinkedInClientSecret,
			RedirectURL:  cfg.LinkedInRedirectURL,
			Scopes: []string{
				"openid",
				"profile",
				"email",
			},
			Endpoint: oauth2.Endpoint{
				AuthURL:  "https://www.linkedin.com/oauth/v2/authorization",
				TokenURL: "https://www.linkedin.com/oauth/v2/accessToken",
			},
		}
	}

	return svc
}

// OAuthUserInfo represents user info from OAuth providers
type OAuthUserInfo struct {
	ID            string
	Email         string
	FirstName     string
	LastName      string
	ProfileImage  string
	EmailVerified bool
	Provider      models.AuthProvider
}

// Google OAuth

func (s *OAuthService) GetGoogleAuthURL(state string) string {
	if s.googleConfig == nil {
		return ""
	}
	return s.googleConfig.AuthCodeURL(state, oauth2.AccessTypeOffline)
}

func (s *OAuthService) HandleGoogleCallback(ctx context.Context, code string) (*OAuthUserInfo, error) {
	if s.googleConfig == nil {
		return nil, errors.New("Google OAuth not configured")
	}

	token, err := s.googleConfig.Exchange(ctx, code)
	if err != nil {
		return nil, fmt.Errorf("failed to exchange code: %w", err)
	}

	client := s.googleConfig.Client(ctx, token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		return nil, fmt.Errorf("failed to get user info: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var googleUser struct {
		ID            string `json:"id"`
		Email         string `json:"email"`
		VerifiedEmail bool   `json:"verified_email"`
		Name          string `json:"name"`
		GivenName     string `json:"given_name"`
		FamilyName    string `json:"family_name"`
		Picture       string `json:"picture"`
	}

	if err := json.Unmarshal(body, &googleUser); err != nil {
		return nil, fmt.Errorf("failed to parse user info: %w", err)
	}

	return &OAuthUserInfo{
		ID:            googleUser.ID,
		Email:         googleUser.Email,
		FirstName:     googleUser.GivenName,
		LastName:      googleUser.FamilyName,
		ProfileImage:  googleUser.Picture,
		EmailVerified: googleUser.VerifiedEmail,
		Provider:      models.AuthProviderGoogle,
	}, nil
}

// LinkedIn OAuth

func (s *OAuthService) GetLinkedInAuthURL(state string) string {
	if s.linkedinConfig == nil {
		return ""
	}
	return s.linkedinConfig.AuthCodeURL(state)
}

func (s *OAuthService) HandleLinkedInCallback(ctx context.Context, code string) (*OAuthUserInfo, error) {
	if s.linkedinConfig == nil {
		return nil, errors.New("LinkedIn OAuth not configured")
	}

	token, err := s.linkedinConfig.Exchange(ctx, code)
	if err != nil {
		return nil, fmt.Errorf("failed to exchange code: %w", err)
	}

	client := s.linkedinConfig.Client(ctx, token)
	
	// Get user profile using OpenID Connect
	resp, err := client.Get("https://api.linkedin.com/v2/userinfo")
	if err != nil {
		return nil, fmt.Errorf("failed to get user info: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var linkedinUser struct {
		Sub           string `json:"sub"`
		Email         string `json:"email"`
		EmailVerified bool   `json:"email_verified"`
		GivenName     string `json:"given_name"`
		FamilyName    string `json:"family_name"`
		Picture       string `json:"picture"`
	}

	if err := json.Unmarshal(body, &linkedinUser); err != nil {
		return nil, fmt.Errorf("failed to parse user info: %w", err)
	}

	return &OAuthUserInfo{
		ID:            linkedinUser.Sub,
		Email:         linkedinUser.Email,
		FirstName:     linkedinUser.GivenName,
		LastName:      linkedinUser.FamilyName,
		ProfileImage:  linkedinUser.Picture,
		EmailVerified: linkedinUser.EmailVerified,
		Provider:      models.AuthProviderLinkedIn,
	}, nil
}

// Apple OAuth

type AppleClaims struct {
	jwt.RegisteredClaims
	Email         string `json:"email"`
	EmailVerified string `json:"email_verified"`
}

func (s *OAuthService) GetAppleAuthURL(state string) string {
	if s.config.AppleClientID == "" {
		return ""
	}
	
	// Apple uses form_post response mode
	return fmt.Sprintf(
		"https://appleid.apple.com/auth/authorize?client_id=%s&redirect_uri=%s&response_type=code id_token&scope=name email&response_mode=form_post&state=%s",
		s.config.AppleClientID,
		s.config.AppleRedirectURL,
		state,
	)
}

func (s *OAuthService) HandleAppleCallback(ctx context.Context, code string, idToken string, userData string) (*OAuthUserInfo, error) {
	if s.config.AppleClientID == "" {
		return nil, errors.New("Apple OAuth not configured")
	}

	// Parse the ID token (already provided by Apple in form_post)
	token, _, err := new(jwt.Parser).ParseUnverified(idToken, &AppleClaims{})
	if err != nil {
		return nil, fmt.Errorf("failed to parse ID token: %w", err)
	}

	claims, ok := token.Claims.(*AppleClaims)
	if !ok {
		return nil, errors.New("invalid token claims")
	}

	info := &OAuthUserInfo{
		ID:            claims.Subject,
		Email:         claims.Email,
		EmailVerified: claims.EmailVerified == "true",
		Provider:      models.AuthProviderApple,
	}

	// Apple only sends name on first authorization
	if userData != "" {
		var user struct {
			Name struct {
				FirstName string `json:"firstName"`
				LastName  string `json:"lastName"`
			} `json:"name"`
		}
		if err := json.Unmarshal([]byte(userData), &user); err == nil {
			info.FirstName = user.Name.FirstName
			info.LastName = user.Name.LastName
		}
	}

	return info, nil
}

// Validation helpers

func (s *OAuthService) IsGoogleEnabled() bool {
	return s.googleConfig != nil
}

func (s *OAuthService) IsLinkedInEnabled() bool {
	return s.linkedinConfig != nil
}

func (s *OAuthService) IsAppleEnabled() bool {
	return s.config.AppleClientID != ""
}

// GenerateState creates a secure random state for OAuth
func GenerateState() string {
	return fmt.Sprintf("%d", time.Now().UnixNano())
}
