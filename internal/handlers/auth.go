package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ukuvago/angelvault/internal/config"
	"github.com/ukuvago/angelvault/internal/middleware"
	"github.com/ukuvago/angelvault/internal/models"
	"github.com/ukuvago/angelvault/internal/services"
)

type AuthHandler struct {
	authService  *services.AuthService
	oauthService *services.OAuthService
	config       *config.Config
}

func NewAuthHandler(authSvc *services.AuthService, oauthSvc *services.OAuthService, cfg *config.Config) *AuthHandler {
	return &AuthHandler{
		authService:  authSvc,
		oauthService: oauthSvc,
		config:       cfg,
	}
}

// Register handles user registration
func (h *AuthHandler) Register(c *gin.Context) {
	var req services.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	resp, err := h.authService.Register(&req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, resp)
}

// Login handles user login
func (h *AuthHandler) Login(c *gin.Context) {
	var req services.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	resp, err := h.authService.Login(&req)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, resp)
}

// GetCurrentUser returns the authenticated user
func (h *AuthHandler) GetCurrentUser(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	user, err := h.authService.GetUserByID(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"user": user.ToResponse()})
}

// UpdateProfile updates user profile
func (h *AuthHandler) UpdateProfile(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var req struct {
		FirstName   string `json:"first_name" binding:"required"`
		LastName    string `json:"last_name" binding:"required"`
		CompanyName string `json:"company_name"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.authService.UpdateProfile(userID, req.FirstName, req.LastName, req.CompanyName)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"user": user.ToResponse()})
}

// UpdateInvestorProfile updates investor-specific profile details
func (h *AuthHandler) UpdateInvestorProfile(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var req struct {
		// Investor Type
		InvestorType        string `json:"investor_type"` // private or institutional
		
		// Profile Info
		Bio                 string `json:"bio"`
		LinkedInURL         string `json:"linkedin_url"`
		WebsiteURL          string `json:"website_url"`
		ProfileImageURL     string `json:"profile_image_url"`
		
		// Investment Preferences
		MinCheckSize        int64  `json:"min_check_size"`
		MaxCheckSize        int64  `json:"max_check_size"`
		FocusAreas          string `json:"focus_areas"`       // comma-separated
		PreferredStages     string `json:"preferred_stages"`  // comma-separated
		
		// Institutional Details (required for institutional investors)
		CompanyLegalName    string `json:"company_legal_name"`
		CompanyRegistration string `json:"company_registration"`
		CompanyJurisdiction string `json:"company_jurisdiction"`
		CompanyAddress      string `json:"company_address"`
		CompanyCity         string `json:"company_city"`
		CompanyState        string `json:"company_state"`
		CompanyPostalCode   string `json:"company_postal_code"`
		CompanyCountry      string `json:"company_country"`
		TaxID               string `json:"tax_id"`
		
		// Authorized Signatory (for institutional)
		SignatoryName       string `json:"signatory_name"`
		SignatoryTitle      string `json:"signatory_title"`
		SignatoryEmail      string `json:"signatory_email"`
		
		// Privacy
		IsProfilePublic     bool   `json:"is_profile_public"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Map investor type
	investorType := models.InvestorTypePrivate
	if req.InvestorType == "institutional" {
		investorType = models.InvestorTypeInstitutional
	}

	profile := &models.InvestorProfile{
		InvestorType:        investorType,
		Bio:                 req.Bio,
		LinkedInURL:         req.LinkedInURL,
		WebsiteURL:          req.WebsiteURL,
		ProfileImageURL:     req.ProfileImageURL,
		MinCheckSize:        req.MinCheckSize,
		MaxCheckSize:        req.MaxCheckSize,
		FocusAreas:          req.FocusAreas,
		PreferredStages:     req.PreferredStages,
		CompanyLegalName:    req.CompanyLegalName,
		CompanyRegistration: req.CompanyRegistration,
		CompanyJurisdiction: req.CompanyJurisdiction,
		CompanyAddress:      req.CompanyAddress,
		CompanyCity:         req.CompanyCity,
		CompanyState:        req.CompanyState,
		CompanyPostalCode:   req.CompanyPostalCode,
		CompanyCountry:      req.CompanyCountry,
		TaxID:               req.TaxID,
		SignatoryName:       req.SignatoryName,
		SignatoryTitle:      req.SignatoryTitle,
		SignatoryEmail:      req.SignatoryEmail,
		IsProfilePublic:     req.IsProfilePublic,
	}

	updatedProfile, err := h.authService.UpdateInvestorProfile(userID, profile)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Investor profile updated successfully",
		"profile": updatedProfile,
	})
}

// GetInvestorProfile retrieves investor-specific profile details
func (h *AuthHandler) GetInvestorProfile(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	profile, err := h.authService.GetInvestorProfile(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Investor profile not found"})
		return
	}

	c.JSON(http.StatusOK, profile)
}

// ChangePassword changes user's password
func (h *AuthHandler) ChangePassword(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var req struct {
		CurrentPassword string `json:"current_password" binding:"required"`
		NewPassword     string `json:"new_password" binding:"required,min=8"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.authService.ChangePassword(userID, req.CurrentPassword, req.NewPassword); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password changed successfully"})
}

// RequestPasswordReset initiates password reset
func (h *AuthHandler) RequestPasswordReset(c *gin.Context) {
	var req struct {
		Email string `json:"email" binding:"required,email"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Always return success to prevent email enumeration
	h.authService.RequestPasswordReset(req.Email)
	c.JSON(http.StatusOK, gin.H{"message": "If an account with that email exists, a reset link has been sent"})
}

// ResetPassword completes password reset
func (h *AuthHandler) ResetPassword(c *gin.Context) {
	var req struct {
		Token       string `json:"token" binding:"required"`
		NewPassword string `json:"new_password" binding:"required,min=8"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.authService.ResetPassword(req.Token, req.NewPassword); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password reset successfully"})
}

// VerifyEmail verifies user's email
func (h *AuthHandler) VerifyEmail(c *gin.Context) {
	token := c.Query("token")
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Token required"})
		return
	}

	if err := h.authService.VerifyEmail(token); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Email verified successfully"})
}

// OAuth Handlers

// GetOAuthProviders returns available OAuth providers
func (h *AuthHandler) GetOAuthProviders(c *gin.Context) {
	providers := []gin.H{}

	if h.oauthService.IsGoogleEnabled() {
		providers = append(providers, gin.H{
			"name":    "google",
			"enabled": true,
		})
	}

	if h.oauthService.IsLinkedInEnabled() {
		providers = append(providers, gin.H{
			"name":    "linkedin",
			"enabled": true,
		})
	}

	if h.oauthService.IsAppleEnabled() {
		providers = append(providers, gin.H{
			"name":    "apple",
			"enabled": true,
		})
	}

	c.JSON(http.StatusOK, gin.H{"providers": providers})
}

// GoogleAuthURL returns the Google OAuth URL
func (h *AuthHandler) GoogleAuthURL(c *gin.Context) {
	role := c.Query("role")
	if role == "" {
		role = "investor"
	}

	state := services.GenerateState() + ":" + role
	url := h.oauthService.GetGoogleAuthURL(state)

	if url == "" {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Google OAuth not configured"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"url": url})
}

// GoogleCallback handles Google OAuth callback
func (h *AuthHandler) GoogleCallback(c *gin.Context) {
	code := c.Query("code")
	state := c.Query("state")

	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Authorization code required"})
		return
	}

	// Extract role from state
	role := models.RoleInvestor
	if len(state) > 0 {
		parts := splitState(state)
		if len(parts) > 1 && parts[1] == "developer" {
			role = models.RoleDeveloper
		}
	}

	userInfo, err := h.oauthService.HandleGoogleCallback(c.Request.Context(), code)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	resp, err := h.authService.LoginWithOAuth(userInfo, role)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Redirect to frontend with token
	redirectURL := h.config.BaseURL + "/auth/callback?token=" + resp.Token
	c.Redirect(http.StatusFound, redirectURL)
}

// LinkedInAuthURL returns the LinkedIn OAuth URL
func (h *AuthHandler) LinkedInAuthURL(c *gin.Context) {
	role := c.Query("role")
	if role == "" {
		role = "investor"
	}

	state := services.GenerateState() + ":" + role
	url := h.oauthService.GetLinkedInAuthURL(state)

	if url == "" {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "LinkedIn OAuth not configured"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"url": url})
}

// LinkedInCallback handles LinkedIn OAuth callback
func (h *AuthHandler) LinkedInCallback(c *gin.Context) {
	code := c.Query("code")
	state := c.Query("state")

	if code == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Authorization code required"})
		return
	}

	role := models.RoleInvestor
	if len(state) > 0 {
		parts := splitState(state)
		if len(parts) > 1 && parts[1] == "developer" {
			role = models.RoleDeveloper
		}
	}

	userInfo, err := h.oauthService.HandleLinkedInCallback(c.Request.Context(), code)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	resp, err := h.authService.LoginWithOAuth(userInfo, role)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	redirectURL := h.config.BaseURL + "/auth/callback?token=" + resp.Token
	c.Redirect(http.StatusFound, redirectURL)
}

// AppleAuthURL returns the Apple OAuth URL
func (h *AuthHandler) AppleAuthURL(c *gin.Context) {
	role := c.Query("role")
	if role == "" {
		role = "investor"
	}

	state := services.GenerateState() + ":" + role
	url := h.oauthService.GetAppleAuthURL(state)

	if url == "" {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Apple OAuth not configured"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"url": url})
}

// AppleCallback handles Apple OAuth callback (form_post)
func (h *AuthHandler) AppleCallback(c *gin.Context) {
	code := c.PostForm("code")
	idToken := c.PostForm("id_token")
	state := c.PostForm("state")
	userData := c.PostForm("user") // Only sent on first authorization

	if code == "" || idToken == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid callback data"})
		return
	}

	role := models.RoleInvestor
	if len(state) > 0 {
		parts := splitState(state)
		if len(parts) > 1 && parts[1] == "developer" {
			role = models.RoleDeveloper
		}
	}

	userInfo, err := h.oauthService.HandleAppleCallback(c.Request.Context(), code, idToken, userData)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	resp, err := h.authService.LoginWithOAuth(userInfo, role)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	redirectURL := h.config.BaseURL + "/auth/callback?token=" + resp.Token
	c.Redirect(http.StatusFound, redirectURL)
}

// Helper to split state string
func splitState(state string) []string {
	result := []string{}
	current := ""
	for _, c := range state {
		if c == ':' {
			result = append(result, current)
			current = ""
		} else {
			current += string(c)
		}
	}
	if current != "" {
		result = append(result, current)
	}
	return result
}
