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

type ProjectService struct {
	config         *config.Config
	paymentService *PaymentService
	ndaService     *NDAService
}

func NewProjectService(cfg *config.Config, paymentSvc *PaymentService, ndaSvc *NDAService) *ProjectService {
	return &ProjectService{
		config:         cfg,
		paymentService: paymentSvc,
		ndaService:     ndaSvc,
	}
}

// CreateProjectRequest represents project creation input
type CreateProjectRequest struct {
	Title         string    `json:"title" binding:"required"`
	Tagline       string    `json:"tagline"`
	Description   string    `json:"description" binding:"required"`
	CategoryID    uuid.UUID `json:"category_id" binding:"required"`
	Problem       string    `json:"problem"`
	Solution      string    `json:"solution"`
	BusinessModel string    `json:"business_model"`
	MinInvestment int64     `json:"min_investment" binding:"required"`
	MaxInvestment int64     `json:"max_investment"`
	EquityOffered float64   `json:"equity_offered"`
	ValuationCap  int64     `json:"valuation_cap"`
	ContactEmail  string    `json:"contact_email" binding:"required,email"`
	ContactPhone  string    `json:"contact_phone"`
	WebsiteURL    string    `json:"website_url"`
	POCURL        string    `json:"poc_url"`
}

// ListProjectsParams for filtering projects
type ListProjectsParams struct {
	CategoryID   *uuid.UUID
	Status       *models.ProjectStatus
	Search       string
	MinAmount    *int64
	MaxAmount    *int64
	SortBy       string
	SortOrder    string
	Page         int
	PageSize     int
	InvestorID   *uuid.UUID // To check unlock status
}

// CreateProject creates a new project
func (s *ProjectService) CreateProject(developerID uuid.UUID, req *CreateProjectRequest) (*models.Project, error) {
	db := database.GetDB()

	// Verify category exists
	var category models.Category
	if err := db.First(&category, "id = ?", req.CategoryID).Error; err != nil {
		return nil, errors.New("invalid category")
	}

	project := &models.Project{
		DeveloperID:   developerID,
		CategoryID:    req.CategoryID,
		Title:         req.Title,
		Tagline:       req.Tagline,
		Description:   req.Description,
		Problem:       req.Problem,
		Solution:      req.Solution,
		BusinessModel: req.BusinessModel,
		MinInvestment: req.MinInvestment,
		MaxInvestment: req.MaxInvestment,
		EquityOffered: req.EquityOffered,
		ValuationCap:  req.ValuationCap,
		ContactEmail:  req.ContactEmail,
		ContactPhone:  req.ContactPhone,
		WebsiteURL:    req.WebsiteURL,
		POCURL:        req.POCURL,
		Status:        models.ProjectStatusDraft,
	}

	if err := db.Create(project).Error; err != nil {
		return nil, err
	}

	// Load relations
	db.Preload("Category").First(project, "id = ?", project.ID)

	return project, nil
}

// UpdateProject updates an existing project
func (s *ProjectService) UpdateProject(projectID, developerID uuid.UUID, req *CreateProjectRequest) (*models.Project, error) {
	db := database.GetDB()

	var project models.Project
	if err := db.First(&project, "id = ? AND developer_id = ?", projectID, developerID).Error; err != nil {
		return nil, errors.New("project not found")
	}

	if !project.CanEdit() {
		return nil, errors.New("project cannot be edited in current status")
	}

	// Update fields
	project.Title = req.Title
	project.Tagline = req.Tagline
	project.Description = req.Description
	project.CategoryID = req.CategoryID
	project.Problem = req.Problem
	project.Solution = req.Solution
	project.BusinessModel = req.BusinessModel
	project.MinInvestment = req.MinInvestment
	project.MaxInvestment = req.MaxInvestment
	project.EquityOffered = req.EquityOffered
	project.ValuationCap = req.ValuationCap
	project.ContactEmail = req.ContactEmail
	project.ContactPhone = req.ContactPhone
	project.WebsiteURL = req.WebsiteURL
	project.POCURL = req.POCURL

	if err := db.Save(&project).Error; err != nil {
		return nil, err
	}

	db.Preload("Category").Preload("TeamMembers").First(&project, "id = ?", project.ID)
	return &project, nil
}

// SubmitProject submits a project for review
func (s *ProjectService) SubmitProject(projectID, developerID uuid.UUID) (*models.Project, error) {
	db := database.GetDB()

	var project models.Project
	if err := db.First(&project, "id = ? AND developer_id = ?", projectID, developerID).Error; err != nil {
		return nil, errors.New("project not found")
	}

	if project.Status != models.ProjectStatusDraft && project.Status != models.ProjectStatusRejected {
		return nil, errors.New("project cannot be submitted in current status")
	}

	now := time.Now()
	project.Status = models.ProjectStatusPending
	project.SubmittedAt = &now
	project.RejectionReason = ""

	if err := db.Save(&project).Error; err != nil {
		return nil, err
	}

	return &project, nil
}

// GetProject returns a project with appropriate visibility
func (s *ProjectService) GetProject(projectID uuid.UUID, investorID *uuid.UUID) (*models.Project, bool, error) {
	db := database.GetDB()

	var project models.Project
	if err := db.Preload("Category").
		Preload("Developer").
		Preload("TeamMembers").
		Preload("Images").
		First(&project, "id = ?", projectID).Error; err != nil {
		return nil, false, errors.New("project not found")
	}

	// Check if project is unlocked for this investor
	isUnlocked := false
	if investorID != nil {
		isUnlocked = s.paymentService.HasViewedProject(*investorID, projectID)
	}

	return &project, isUnlocked, nil
}

// ListProjects returns projects with filters
func (s *ProjectService) ListProjects(params ListProjectsParams) ([]models.Project, int64, error) {
	db := database.GetDB()

	query := db.Model(&models.Project{}).
		Preload("Category").
		Preload("Developer")

	// Apply filters
	if params.Status != nil {
		query = query.Where("status = ?", *params.Status)
	} else {
		// Default to approved for public listing
		query = query.Where("status = ?", models.ProjectStatusApproved)
	}

	if params.CategoryID != nil {
		query = query.Where("category_id = ?", *params.CategoryID)
	}

	if params.Search != "" {
		search := "%" + strings.ToLower(params.Search) + "%"
		query = query.Where("LOWER(title) LIKE ? OR LOWER(tagline) LIKE ?", search, search)
	}

	if params.MinAmount != nil {
		query = query.Where("min_investment >= ?", *params.MinAmount)
	}

	if params.MaxAmount != nil {
		query = query.Where("min_investment <= ?", *params.MaxAmount)
	}

	// Count total
	var total int64
	query.Count(&total)

	// Sorting
	sortBy := "created_at"
	if params.SortBy != "" {
		sortBy = params.SortBy
	}
	sortOrder := "DESC"
	if params.SortOrder == "asc" {
		sortOrder = "ASC"
	}
	query = query.Order(sortBy + " " + sortOrder)

	// Pagination
	if params.Page < 1 {
		params.Page = 1
	}
	if params.PageSize < 1 || params.PageSize > 100 {
		params.PageSize = 20
	}
	offset := (params.Page - 1) * params.PageSize
	query = query.Offset(offset).Limit(params.PageSize)

	var projects []models.Project
	if err := query.Find(&projects).Error; err != nil {
		return nil, 0, err
	}

	return projects, total, nil
}

// ListPublicProjects returns projects as public view (limited info)
func (s *ProjectService) ListPublicProjects(params ListProjectsParams) ([]models.ProjectPublicView, int64, error) {
	projects, total, err := s.ListProjects(params)
	if err != nil {
		return nil, 0, err
	}

	// Get unlocked projects for investor if provided
	unlockedMap := make(map[uuid.UUID]bool)
	if params.InvestorID != nil {
		views, _ := s.paymentService.GetViewedProjects(*params.InvestorID)
		for _, v := range views {
			unlockedMap[v.ProjectID] = true
		}
	}

	publicViews := make([]models.ProjectPublicView, len(projects))
	for i, p := range projects {
		categoryName := ""
		if p.Category != nil {
			categoryName = p.Category.Name
		}
		publicViews[i] = p.ToPublicView(categoryName, unlockedMap[p.ID])
	}

	return publicViews, total, nil
}

// GetDeveloperProjects returns projects for a developer
func (s *ProjectService) GetDeveloperProjects(developerID uuid.UUID) ([]models.Project, error) {
	db := database.GetDB()

	var projects []models.Project
	err := db.Where("developer_id = ?", developerID).
		Preload("Category").
		Order("created_at DESC").
		Find(&projects).Error

	return projects, err
}

// UnlockProject unlocks a project for an investor
func (s *ProjectService) UnlockProject(investorID, projectID uuid.UUID) error {
	db := database.GetDB()

	// Verify project exists and is approved
	var project models.Project
	if err := db.First(&project, "id = ? AND status = ?", projectID, models.ProjectStatusApproved).Error; err != nil {
		return errors.New("project not found or not available")
	}

	// Check NDA status
	ndaStatus := s.ndaService.GetProjectNDAStatus(investorID, projectID)
	if !ndaStatus.CanAccess {
		if !ndaStatus.HasMasterNDA {
			return errors.New("master NDA required")
		}
		if ndaStatus.RequiresAddendum && !ndaStatus.HasAddendum {
			return errors.New("project NDA addendum required")
		}
	}

	// Use view credit
	if err := s.paymentService.UseViewCredit(investorID, projectID); err != nil {
		return err
	}

	// Increment view count
	db.Model(&project).Update("view_count", project.ViewCount+1)

	return nil
}

// AddTeamMember adds a team member to a project
func (s *ProjectService) AddTeamMember(projectID, developerID uuid.UUID, member *models.TeamMember) error {
	db := database.GetDB()

	// Verify ownership
	var project models.Project
	if err := db.First(&project, "id = ? AND developer_id = ?", projectID, developerID).Error; err != nil {
		return errors.New("project not found")
	}

	// If this is primary contact, unset others
	if member.IsPrimaryContact {
		db.Model(&models.TeamMember{}).
			Where("project_id = ?", projectID).
			Update("is_primary_contact", false)
	}

	member.ProjectID = projectID
	return db.Create(member).Error
}

// UpdateTeamMember updates a team member
func (s *ProjectService) UpdateTeamMember(memberID, developerID uuid.UUID, updates *models.TeamMember) error {
	db := database.GetDB()

	var member models.TeamMember
	if err := db.Preload("Project").First(&member, "id = ?", memberID).Error; err != nil {
		return errors.New("team member not found")
	}

	// Verify ownership via project
	var project models.Project
	if err := db.First(&project, "id = ? AND developer_id = ?", member.ProjectID, developerID).Error; err != nil {
		return errors.New("not authorized")
	}

	// If this is becoming primary contact, unset others
	if updates.IsPrimaryContact && !member.IsPrimaryContact {
		db.Model(&models.TeamMember{}).
			Where("project_id = ?", member.ProjectID).
			Update("is_primary_contact", false)
	}

	member.FirstName = updates.FirstName
	member.LastName = updates.LastName
	member.Role = updates.Role
	member.Bio = updates.Bio
	member.ImageURL = updates.ImageURL
	member.LinkedInURL = updates.LinkedInURL
	member.WebsiteURL = updates.WebsiteURL
	member.IsPrimaryContact = updates.IsPrimaryContact
	member.ContactEmail = updates.ContactEmail
	member.ContactPhone = updates.ContactPhone
	member.IsLead = updates.IsLead
	member.DisplayOrder = updates.DisplayOrder

	return db.Save(&member).Error
}

// DeleteTeamMember removes a team member
func (s *ProjectService) DeleteTeamMember(memberID, developerID uuid.UUID) error {
	db := database.GetDB()

	var member models.TeamMember
	if err := db.First(&member, "id = ?", memberID).Error; err != nil {
		return errors.New("team member not found")
	}

	// Verify ownership
	var project models.Project
	if err := db.First(&project, "id = ? AND developer_id = ?", member.ProjectID, developerID).Error; err != nil {
		return errors.New("not authorized")
	}

	return db.Delete(&member).Error
}
