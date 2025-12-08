package services

import (
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/ukuvago/angelvault/internal/config"
	"github.com/ukuvago/angelvault/internal/database"
	"github.com/ukuvago/angelvault/internal/models"
)

type AdminService struct {
	config *config.Config
}

func NewAdminService(cfg *config.Config) *AdminService {
	return &AdminService{config: cfg}
}

// ========================================
// USER MANAGEMENT
// ========================================

// ListUsers returns all users with pagination
func (s *AdminService) ListUsers(page, pageSize int, role string, search string) ([]models.User, int64, error) {
	db := database.GetDB()

	query := db.Model(&models.User{})

	if role != "" {
		query = query.Where("role = ?", role)
	}

	if search != "" {
		search = "%" + strings.ToLower(search) + "%"
		query = query.Where("LOWER(email) LIKE ? OR LOWER(first_name) LIKE ? OR LOWER(last_name) LIKE ?", 
			search, search, search)
	}

	var total int64
	query.Count(&total)

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	var users []models.User
	err := query.
		Preload("InvestorProfile").
		Order("created_at DESC").
		Offset((page - 1) * pageSize).
		Limit(pageSize).
		Find(&users).Error

	return users, total, err
}

// GetUser returns a user by ID
func (s *AdminService) GetUser(userID uuid.UUID) (*models.User, error) {
	db := database.GetDB()

	var user models.User
	if err := db.Preload("InvestorProfile").First(&user, "id = ?", userID).Error; err != nil {
		return nil, errors.New("user not found")
	}

	return &user, nil
}

// UpdateUser updates a user's details (admin can update any user)
func (s *AdminService) UpdateUser(userID uuid.UUID, firstName, lastName, companyName string, role models.UserRole, isActive bool) (*models.User, error) {
	db := database.GetDB()

	var user models.User
	if err := db.First(&user, "id = ?", userID).Error; err != nil {
		return nil, errors.New("user not found")
	}

	user.FirstName = firstName
	user.LastName = lastName
	user.CompanyName = companyName
	user.Role = role
	user.IsActive = isActive

	if err := db.Save(&user).Error; err != nil {
		return nil, err
	}

	return &user, nil
}

// CreateDeveloperUser creates a new developer account (for admin to create on behalf of founders)
func (s *AdminService) CreateDeveloperUser(email, firstName, lastName, companyName, password string) (*models.User, error) {
	db := database.GetDB()

	// Check if email exists
	var existing models.User
	if err := db.Where("email = ?", strings.ToLower(email)).First(&existing).Error; err == nil {
		return nil, errors.New("email already registered")
	}

	user := &models.User{
		Email:        strings.ToLower(email),
		FirstName:    firstName,
		LastName:     lastName,
		CompanyName:  companyName,
		Role:         models.RoleDeveloper,
		AuthProvider: models.AuthProviderEmail,
		EmailVerified: true, // Admin-created accounts are pre-verified
		IsActive:     true,
	}

	if password != "" {
		if err := user.SetPassword(password); err != nil {
			return nil, err
		}
	}

	if err := db.Create(user).Error; err != nil {
		return nil, err
	}

	return user, nil
}

// CreateAdminUser creates a new admin account (only admins can create admins)
func (s *AdminService) CreateAdminUser(email, firstName, lastName, password string) (*models.User, error) {
	db := database.GetDB()

	// Check if email exists
	var existing models.User
	if err := db.Where("email = ?", strings.ToLower(email)).First(&existing).Error; err == nil {
		return nil, errors.New("email already registered")
	}

	if password == "" {
		return nil, errors.New("password required for admin accounts")
	}

	if len(password) < 12 {
		return nil, errors.New("admin password must be at least 12 characters")
	}

	user := &models.User{
		Email:        strings.ToLower(email),
		FirstName:    firstName,
		LastName:     lastName,
		Role:         models.RoleAdmin,
		AuthProvider: models.AuthProviderEmail,
		EmailVerified: true,
		IsActive:     true,
	}

	if err := user.SetPassword(password); err != nil {
		return nil, err
	}

	if err := db.Create(user).Error; err != nil {
		return nil, err
	}

	return user, nil
}

// UpdateAdminUser updates an admin user
func (s *AdminService) UpdateAdminUser(adminID uuid.UUID, firstName, lastName string, isActive bool) (*models.User, error) {
	db := database.GetDB()

	var user models.User
	if err := db.First(&user, "id = ? AND role = ?", adminID, models.RoleAdmin).Error; err != nil {
		return nil, errors.New("admin user not found")
	}

	user.FirstName = firstName
	user.LastName = lastName
	user.IsActive = isActive

	if err := db.Save(&user).Error; err != nil {
		return nil, err
	}

	return &user, nil
}

// DeleteAdminUser deactivates an admin user (soft delete)
func (s *AdminService) DeleteAdminUser(adminID uuid.UUID) error {
	db := database.GetDB()

	// Count remaining active admins
	var activeAdminCount int64
	db.Model(&models.User{}).Where("role = ? AND is_active = ? AND id != ?", 
		models.RoleAdmin, true, adminID).Count(&activeAdminCount)
	
	if activeAdminCount == 0 {
		return errors.New("cannot delete the last active admin")
	}

	return db.Model(&models.User{}).
		Where("id = ? AND role = ?", adminID, models.RoleAdmin).
		Update("is_active", false).Error
}

// ListAdminUsers returns all admin users
func (s *AdminService) ListAdminUsers() ([]models.User, error) {
	db := database.GetDB()

	var admins []models.User
	err := db.Where("role = ?", models.RoleAdmin).
		Order("created_at DESC").
		Find(&admins).Error

	return admins, err
}

// ResetAdminPassword resets another admin's password
func (s *AdminService) ResetAdminPassword(adminID uuid.UUID, newPassword string) error {
	db := database.GetDB()

	if len(newPassword) < 12 {
		return errors.New("admin password must be at least 12 characters")
	}

	var user models.User
	if err := db.First(&user, "id = ? AND role = ?", adminID, models.RoleAdmin).Error; err != nil {
		return errors.New("admin user not found")
	}

	if err := user.SetPassword(newPassword); err != nil {
		return err
	}

	return db.Save(&user).Error
}

// ========================================
// PROJECT MANAGEMENT
// ========================================

// CreateProjectRequest for admin project creation
type AdminCreateProjectRequest struct {
	// Developer association
	DeveloperID   *uuid.UUID `json:"developer_id"`      // Existing developer
	DeveloperEmail string    `json:"developer_email"`   // Or create new
	DeveloperFirstName string `json:"developer_first_name"`
	DeveloperLastName  string `json:"developer_last_name"`
	DeveloperCompany   string `json:"developer_company"`
	
	// Project details
	CategoryID      uuid.UUID `json:"category_id" binding:"required"`
	Title           string    `json:"title" binding:"required"`
	Tagline         string    `json:"tagline"`
	Description     string    `json:"description" binding:"required"`
	Problem         string    `json:"problem"`
	Solution        string    `json:"solution"`
	BusinessModel   string    `json:"business_model"`
	ExecutiveSummary string   `json:"executive_summary"`
	UseOfFunds      string    `json:"use_of_funds"`
	
	// Investment terms
	MinInvestment   int64     `json:"min_investment" binding:"required"`
	MaxInvestment   int64     `json:"max_investment"`
	EquityOffered   float64   `json:"equity_offered"`
	ValuationCap    int64     `json:"valuation_cap"`
	
	// Contact
	ContactEmail    string    `json:"contact_email" binding:"required,email"`
	ContactPhone    string    `json:"contact_phone"`
	WebsiteURL      string    `json:"website_url"`
	
	// Status
	Status          models.ProjectStatus `json:"status"`
	
	// Team members
	TeamMembers     []TeamMemberInput `json:"team_members"`
}

type TeamMemberInput struct {
	FirstName        string `json:"first_name" binding:"required"`
	LastName         string `json:"last_name" binding:"required"`
	Role             string `json:"role" binding:"required"`
	Bio              string `json:"bio"`
	ImageURL         string `json:"image_url"`
	LinkedInURL      string `json:"linkedin_url"`
	WebsiteURL       string `json:"website_url"`
	IsPrimaryContact bool   `json:"is_primary_contact"`
	ContactEmail     string `json:"contact_email"`
	ContactPhone     string `json:"contact_phone"`
	IsLead           bool   `json:"is_lead"`
	DisplayOrder     int    `json:"display_order"`
}

// CreateProjectForDeveloper creates a project on behalf of a developer
func (s *AdminService) CreateProjectForDeveloper(req *AdminCreateProjectRequest) (*models.Project, error) {
	db := database.GetDB()

	var developerID uuid.UUID

	// Get or create developer
	if req.DeveloperID != nil && *req.DeveloperID != uuid.Nil {
		// Use existing developer
		var dev models.User
		if err := db.First(&dev, "id = ? AND role = ?", *req.DeveloperID, models.RoleDeveloper).Error; err != nil {
			return nil, errors.New("developer not found")
		}
		developerID = dev.ID
	} else if req.DeveloperEmail != "" {
		// Create new developer
		newDev, err := s.CreateDeveloperUser(
			req.DeveloperEmail,
			req.DeveloperFirstName,
			req.DeveloperLastName,
			req.DeveloperCompany,
			"", // No password - they'll use OAuth or reset
		)
		if err != nil {
			return nil, err
		}
		developerID = newDev.ID
	} else {
		return nil, errors.New("developer_id or developer_email required")
	}

	// Verify category exists
	var category models.Category
	if err := db.First(&category, "id = ?", req.CategoryID).Error; err != nil {
		return nil, errors.New("invalid category")
	}

	// Create project
	status := req.Status
	if status == "" {
		status = models.ProjectStatusDraft
	}

	project := &models.Project{
		DeveloperID:      developerID,
		CategoryID:       req.CategoryID,
		Title:            req.Title,
		Tagline:          req.Tagline,
		Description:      req.Description,
		Problem:          req.Problem,
		Solution:         req.Solution,
		BusinessModel:    req.BusinessModel,
		ExecutiveSummary: req.ExecutiveSummary,
		UseOfFunds:       req.UseOfFunds,
		MinInvestment:    req.MinInvestment,
		MaxInvestment:    req.MaxInvestment,
		EquityOffered:    req.EquityOffered,
		ValuationCap:     req.ValuationCap,
		ContactEmail:     req.ContactEmail,
		ContactPhone:     req.ContactPhone,
		WebsiteURL:       req.WebsiteURL,
		Status:           status,
	}

	if err := db.Create(project).Error; err != nil {
		return nil, err
	}

	// Add team members
	for i, tm := range req.TeamMembers {
		member := &models.TeamMember{
			ProjectID:        project.ID,
			FirstName:        tm.FirstName,
			LastName:         tm.LastName,
			Role:             tm.Role,
			Bio:              tm.Bio,
			ImageURL:         tm.ImageURL,
			LinkedInURL:      tm.LinkedInURL,
			WebsiteURL:       tm.WebsiteURL,
			IsPrimaryContact: tm.IsPrimaryContact,
			ContactEmail:     tm.ContactEmail,
			ContactPhone:     tm.ContactPhone,
			IsLead:           tm.IsLead,
			DisplayOrder:     i,
		}
		db.Create(member)
	}

	// Load relations
	db.Preload("Category").Preload("Developer").Preload("TeamMembers").First(project, "id = ?", project.ID)

	return project, nil
}

// UpdateProject allows admin to update any project
func (s *AdminService) UpdateProject(projectID uuid.UUID, req *AdminCreateProjectRequest) (*models.Project, error) {
	db := database.GetDB()

	var project models.Project
	if err := db.First(&project, "id = ?", projectID).Error; err != nil {
		return nil, errors.New("project not found")
	}

	// Update fields
	project.CategoryID = req.CategoryID
	project.Title = req.Title
	project.Tagline = req.Tagline
	project.Description = req.Description
	project.Problem = req.Problem
	project.Solution = req.Solution
	project.BusinessModel = req.BusinessModel
	project.ExecutiveSummary = req.ExecutiveSummary
	project.UseOfFunds = req.UseOfFunds
	project.MinInvestment = req.MinInvestment
	project.MaxInvestment = req.MaxInvestment
	project.EquityOffered = req.EquityOffered
	project.ValuationCap = req.ValuationCap
	project.ContactEmail = req.ContactEmail
	project.ContactPhone = req.ContactPhone
	project.WebsiteURL = req.WebsiteURL

	if req.Status != "" {
		project.Status = req.Status
	}

	if err := db.Save(&project).Error; err != nil {
		return nil, err
	}

	// Update team members if provided
	if len(req.TeamMembers) > 0 {
		// Delete existing and recreate
		db.Where("project_id = ?", projectID).Delete(&models.TeamMember{})
		
		for i, tm := range req.TeamMembers {
			member := &models.TeamMember{
				ProjectID:        project.ID,
				FirstName:        tm.FirstName,
				LastName:         tm.LastName,
				Role:             tm.Role,
				Bio:              tm.Bio,
				ImageURL:         tm.ImageURL,
				LinkedInURL:      tm.LinkedInURL,
				WebsiteURL:       tm.WebsiteURL,
				IsPrimaryContact: tm.IsPrimaryContact,
				ContactEmail:     tm.ContactEmail,
				ContactPhone:     tm.ContactPhone,
				IsLead:           tm.IsLead,
				DisplayOrder:     i,
			}
			db.Create(member)
		}
	}

	db.Preload("Category").Preload("Developer").Preload("TeamMembers").Preload("Images").First(&project, "id = ?", project.ID)
	return &project, nil
}

// ApproveProject approves a pending project
func (s *AdminService) ApproveProject(projectID uuid.UUID) (*models.Project, error) {
	db := database.GetDB()

	var project models.Project
	if err := db.First(&project, "id = ?", projectID).Error; err != nil {
		return nil, errors.New("project not found")
	}

	if project.Status != models.ProjectStatusPending {
		return nil, errors.New("project is not pending approval")
	}

	now := time.Now()
	project.Status = models.ProjectStatusApproved
	project.ApprovedAt = &now
	project.RejectionReason = ""

	if err := db.Save(&project).Error; err != nil {
		return nil, err
	}

	return &project, nil
}

// RejectProject rejects a project with reason
func (s *AdminService) RejectProject(projectID uuid.UUID, reason string) (*models.Project, error) {
	db := database.GetDB()

	var project models.Project
	if err := db.First(&project, "id = ?", projectID).Error; err != nil {
		return nil, errors.New("project not found")
	}

	if project.Status != models.ProjectStatusPending {
		return nil, errors.New("project is not pending approval")
	}

	project.Status = models.ProjectStatusRejected
	project.RejectionReason = reason

	if err := db.Save(&project).Error; err != nil {
		return nil, err
	}

	return &project, nil
}

// ListAllProjects returns all projects for admin
func (s *AdminService) ListAllProjects(page, pageSize int, status string, search string) ([]models.Project, int64, error) {
	db := database.GetDB()

	query := db.Model(&models.Project{})

	if status != "" {
		query = query.Where("status = ?", status)
	}

	if search != "" {
		search = "%" + strings.ToLower(search) + "%"
		query = query.Where("LOWER(title) LIKE ? OR LOWER(tagline) LIKE ?", search, search)
	}

	var total int64
	query.Count(&total)

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	var projects []models.Project
	err := query.
		Preload("Category").
		Preload("Developer").
		Preload("TeamMembers").
		Order("created_at DESC").
		Offset((page - 1) * pageSize).
		Limit(pageSize).
		Find(&projects).Error

	return projects, total, err
}

// GetPendingProjects returns projects awaiting approval
func (s *AdminService) GetPendingProjects() ([]models.Project, error) {
	db := database.GetDB()

	var projects []models.Project
	err := db.Where("status = ?", models.ProjectStatusPending).
		Preload("Category").
		Preload("Developer").
		Preload("TeamMembers").
		Order("submitted_at ASC").
		Find(&projects).Error

	return projects, err
}

// DeleteProject soft deletes a project
func (s *AdminService) DeleteProject(projectID uuid.UUID) error {
	db := database.GetDB()
	return db.Delete(&models.Project{}, "id = ?", projectID).Error
}

// ========================================
// CATEGORY MANAGEMENT
// ========================================

// CreateCategory creates a new category
func (s *AdminService) CreateCategory(name, description, icon, iconURL, color string, displayOrder int) (*models.Category, error) {
	db := database.GetDB()

	// Generate slug
	slug := strings.ToLower(strings.ReplaceAll(name, " ", "-"))
	slug = strings.ReplaceAll(slug, "/", "-")

	// Check if slug exists
	var existing models.Category
	if err := db.Where("slug = ?", slug).First(&existing).Error; err == nil {
		return nil, errors.New("category with this name already exists")
	}

	category := &models.Category{
		Name:         name,
		Slug:         slug,
		Description:  description,
		Icon:         icon,
		IconURL:      iconURL,
		Color:        color,
		DisplayOrder: displayOrder,
		IsActive:     true,
	}

	if err := db.Create(category).Error; err != nil {
		return nil, err
	}

	return category, nil
}

// UpdateCategory updates a category
func (s *AdminService) UpdateCategory(categoryID uuid.UUID, name, description, icon, iconURL, color string, displayOrder int, isActive bool) (*models.Category, error) {
	db := database.GetDB()

	var category models.Category
	if err := db.First(&category, "id = ?", categoryID).Error; err != nil {
		return nil, errors.New("category not found")
	}

	// Update slug if name changed
	if name != category.Name {
		slug := strings.ToLower(strings.ReplaceAll(name, " ", "-"))
		slug = strings.ReplaceAll(slug, "/", "-")
		category.Slug = slug
	}

	category.Name = name
	category.Description = description
	category.Icon = icon
	category.IconURL = iconURL
	category.Color = color
	category.DisplayOrder = displayOrder
	category.IsActive = isActive

	if err := db.Save(&category).Error; err != nil {
		return nil, err
	}

	return &category, nil
}

// DeleteCategory soft deletes a category
func (s *AdminService) DeleteCategory(categoryID uuid.UUID) error {
	db := database.GetDB()

	// Check if category has projects
	var projectCount int64
	db.Model(&models.Project{}).Where("category_id = ?", categoryID).Count(&projectCount)
	if projectCount > 0 {
		return errors.New("cannot delete category with existing projects")
	}

	return db.Delete(&models.Category{}, "id = ?", categoryID).Error
}

// ListCategories returns all categories for admin (including inactive)
func (s *AdminService) ListCategories() ([]models.Category, error) {
	db := database.GetDB()

	var categories []models.Category
	err := db.Order("display_order ASC, name ASC").Find(&categories).Error

	// Get project counts
	for i := range categories {
		var count int64
		db.Model(&models.Project{}).
			Where("category_id = ? AND status = ?", categories[i].ID, models.ProjectStatusApproved).
			Count(&count)
		categories[i].ProjectCount = int(count)
	}

	return categories, err
}

// ========================================
// PROJECT IMAGES MANAGEMENT
// ========================================

type ProjectImageInput struct {
	URL          string `json:"url" binding:"required"`
	ThumbnailURL string `json:"thumbnail_url"`
	Caption      string `json:"caption"`
	Description  string `json:"description"`
	AltText      string `json:"alt_text"`
	DisplayOrder int    `json:"display_order"`
	IsPrimary    bool   `json:"is_primary"`
	ImageType    string `json:"image_type"` // screenshot, logo, team, product, other
}

// AddProjectImage adds an image to a project
func (s *AdminService) AddProjectImage(projectID uuid.UUID, input *ProjectImageInput) (*models.ProjectImage, error) {
	db := database.GetDB()

	// Verify project exists
	var project models.Project
	if err := db.First(&project, "id = ?", projectID).Error; err != nil {
		return nil, errors.New("project not found")
	}

	// If this is primary, unset other primary images
	if input.IsPrimary {
		db.Model(&models.ProjectImage{}).
			Where("project_id = ?", projectID).
			Update("is_primary", false)
	}

	imageType := input.ImageType
	if imageType == "" {
		imageType = "screenshot"
	}

	image := &models.ProjectImage{
		ProjectID:    projectID,
		URL:          input.URL,
		ThumbnailURL: input.ThumbnailURL,
		Caption:      input.Caption,
		Description:  input.Description,
		AltText:      input.AltText,
		DisplayOrder: input.DisplayOrder,
		IsPrimary:    input.IsPrimary,
		ImageType:    imageType,
	}

	if err := db.Create(image).Error; err != nil {
		return nil, err
	}

	// Update project primary image if this is primary
	if input.IsPrimary {
		db.Model(&project).Update("primary_image", input.URL)
	}

	return image, nil
}

// UpdateProjectImage updates a project image
func (s *AdminService) UpdateProjectImage(imageID uuid.UUID, input *ProjectImageInput) (*models.ProjectImage, error) {
	db := database.GetDB()

	var image models.ProjectImage
	if err := db.First(&image, "id = ?", imageID).Error; err != nil {
		return nil, errors.New("image not found")
	}

	// If this is becoming primary, unset other primary images
	if input.IsPrimary && !image.IsPrimary {
		db.Model(&models.ProjectImage{}).
			Where("project_id = ?", image.ProjectID).
			Update("is_primary", false)
	}

	image.URL = input.URL
	image.ThumbnailURL = input.ThumbnailURL
	image.Caption = input.Caption
	image.Description = input.Description
	image.AltText = input.AltText
	image.DisplayOrder = input.DisplayOrder
	image.IsPrimary = input.IsPrimary
	if input.ImageType != "" {
		image.ImageType = input.ImageType
	}

	if err := db.Save(&image).Error; err != nil {
		return nil, err
	}

	// Update project primary image if needed
	if input.IsPrimary {
		db.Model(&models.Project{}).Where("id = ?", image.ProjectID).Update("primary_image", input.URL)
	}

	return &image, nil
}

// DeleteProjectImage deletes a project image
func (s *AdminService) DeleteProjectImage(imageID uuid.UUID) error {
	db := database.GetDB()

	var image models.ProjectImage
	if err := db.First(&image, "id = ?", imageID).Error; err != nil {
		return errors.New("image not found")
	}

	// If this was primary, clear project primary_image
	if image.IsPrimary {
		db.Model(&models.Project{}).Where("id = ?", image.ProjectID).Update("primary_image", "")
	}

	return db.Delete(&image).Error
}

// GetProjectImages returns all images for a project
func (s *AdminService) GetProjectImages(projectID uuid.UUID) ([]models.ProjectImage, error) {
	db := database.GetDB()

	var images []models.ProjectImage
	err := db.Where("project_id = ?", projectID).
		Order("display_order ASC, created_at ASC").
		Find(&images).Error

	return images, err
}

// ========================================
// DASHBOARD STATS
// ========================================

type AdminDashboardStats struct {
	TotalUsers       int64 `json:"total_users"`
	TotalInvestors   int64 `json:"total_investors"`
	TotalDevelopers  int64 `json:"total_developers"`
	TotalProjects    int64 `json:"total_projects"`
	PendingProjects  int64 `json:"pending_projects"`
	ApprovedProjects int64 `json:"approved_projects"`
	FundedProjects   int64 `json:"funded_projects"`
	TotalPayments    int64 `json:"total_payments"`
	TotalRevenue     int64 `json:"total_revenue"` // cents
	TotalNDAs        int64 `json:"total_ndas"`
}

// GetDashboardStats returns admin dashboard statistics
func (s *AdminService) GetDashboardStats() (*AdminDashboardStats, error) {
	db := database.GetDB()

	stats := &AdminDashboardStats{}

	db.Model(&models.User{}).Count(&stats.TotalUsers)
	db.Model(&models.User{}).Where("role = ?", models.RoleInvestor).Count(&stats.TotalInvestors)
	db.Model(&models.User{}).Where("role = ?", models.RoleDeveloper).Count(&stats.TotalDevelopers)
	db.Model(&models.Project{}).Count(&stats.TotalProjects)
	db.Model(&models.Project{}).Where("status = ?", models.ProjectStatusPending).Count(&stats.PendingProjects)
	db.Model(&models.Project{}).Where("status = ?", models.ProjectStatusApproved).Count(&stats.ApprovedProjects)
	db.Model(&models.Project{}).Where("status = ?", models.ProjectStatusFunded).Count(&stats.FundedProjects)
	db.Model(&models.Payment{}).Where("status = ?", models.PaymentStatusCompleted).Count(&stats.TotalPayments)
	db.Model(&models.NDA{}).Count(&stats.TotalNDAs)

	// Sum revenue
	var revenue struct {
		Total int64
	}
	db.Model(&models.Payment{}).
		Where("status = ?", models.PaymentStatusCompleted).
		Select("COALESCE(SUM(amount), 0) as total").
		Scan(&revenue)
	stats.TotalRevenue = revenue.Total

	return stats, nil
}
