package services

import (
	"encoding/json"
	"time"

	"github.com/google/uuid"
	"github.com/ukuvago/angelvault/internal/config"
	"github.com/ukuvago/angelvault/internal/database"
	"github.com/ukuvago/angelvault/internal/models"
)

type AuditService struct {
	config *config.Config
}

func NewAuditService(cfg *config.Config) *AuditService {
	return &AuditService{config: cfg}
}

// LogAction creates an audit log entry
func (s *AuditService) LogAction(
	userID *uuid.UUID,
	userEmail string,
	userRole models.UserRole,
	action models.AuditAction,
	entityType string,
	entityID *uuid.UUID,
	entityName string,
	description string,
	metadata map[string]interface{},
	ipAddress string,
	userAgent string,
) error {
	db := database.GetDB()

	var metadataJSON string
	if metadata != nil {
		bytes, _ := json.Marshal(metadata)
		metadataJSON = string(bytes)
	}

	log := &models.AuditLog{
		UserID:      userID,
		UserEmail:   userEmail,
		UserRole:    userRole,
		Action:      action,
		EntityType:  entityType,
		EntityID:    entityID,
		EntityName:  entityName,
		Description: description,
		Metadata:    metadataJSON,
		IPAddress:   ipAddress,
		UserAgent:   userAgent,
		CreatedAt:   time.Now(),
	}

	return db.Create(log).Error
}

// LogUserAction is a convenience method for user-related actions
func (s *AuditService) LogUserAction(
	user *models.User,
	action models.AuditAction,
	description string,
	ipAddress string,
	userAgent string,
) error {
	return s.LogAction(
		&user.ID,
		user.Email,
		user.Role,
		action,
		"user",
		&user.ID,
		user.FullName(),
		description,
		nil,
		ipAddress,
		userAgent,
	)
}

// LogProjectAction logs project-related actions
func (s *AuditService) LogProjectAction(
	userID uuid.UUID,
	userEmail string,
	userRole models.UserRole,
	action models.AuditAction,
	project *models.Project,
	description string,
	ipAddress string,
) error {
	return s.LogAction(
		&userID,
		userEmail,
		userRole,
		action,
		"project",
		&project.ID,
		project.Title,
		description,
		nil,
		ipAddress,
		"",
	)
}

// LogPaymentAction logs payment-related actions
func (s *AuditService) LogPaymentAction(
	userID uuid.UUID,
	userEmail string,
	action models.AuditAction,
	payment *models.Payment,
	description string,
) error {
	metadata := map[string]interface{}{
		"amount":   payment.Amount,
		"currency": payment.Currency,
		"credits":  payment.ProjectsTotal,
	}

	return s.LogAction(
		&userID,
		userEmail,
		models.RoleInvestor,
		action,
		"payment",
		&payment.ID,
		"",
		description,
		metadata,
		"",
		"",
	)
}

// LogInvestorAccess logs when an investor accesses the platform
func (s *AuditService) LogInvestorAccess(investorID uuid.UUID, ipAddress, userAgent string) (*models.InvestorAccessLog, error) {
	db := database.GetDB()

	accessLog := &models.InvestorAccessLog{
		InvestorID:   investorID,
		SessionStart: time.Now(),
		IPAddress:    ipAddress,
		UserAgent:    userAgent,
	}

	if err := db.Create(accessLog).Error; err != nil {
		return nil, err
	}

	// Also create audit entry
	s.LogAction(
		&investorID,
		"",
		models.RoleInvestor,
		models.AuditActionInvestorAccess,
		"investor",
		&investorID,
		"",
		"Investor accessed platform",
		nil,
		ipAddress,
		userAgent,
	)

	return accessLog, nil
}

// LogProjectView logs when an investor views a project
func (s *AuditService) LogProjectView(
	investorID uuid.UUID,
	projectID uuid.UUID,
	paymentID *uuid.UUID,
	isUnlock bool,
	creditUsed bool,
	ipAddress string,
) error {
	db := database.GetDB()

	viewLog := &models.ProjectViewLog{
		InvestorID: investorID,
		ProjectID:  projectID,
		PaymentID:  paymentID,
		ViewedAt:   time.Now(),
		IsUnlock:   isUnlock,
		CreditUsed: creditUsed,
		IPAddress:  ipAddress,
	}

	if err := db.Create(viewLog).Error; err != nil {
		return err
	}

	// Get project name for audit
	var project models.Project
	db.First(&project, "id = ?", projectID)

	action := models.AuditActionProjectViewed
	if isUnlock {
		action = models.AuditActionProjectUnlocked
	}

	return s.LogAction(
		&investorID,
		"",
		models.RoleInvestor,
		action,
		"project",
		&projectID,
		project.Title,
		"",
		map[string]interface{}{
			"is_unlock":    isUnlock,
			"credit_used":  creditUsed,
		},
		ipAddress,
		"",
	)
}

// LogViewLimitReached logs when an investor hits their view limit
func (s *AuditService) LogViewLimitReached(investorID uuid.UUID, usedCredits, totalCredits int) error {
	return s.LogAction(
		&investorID,
		"",
		models.RoleInvestor,
		models.AuditActionInvestorViewLimit,
		"investor",
		&investorID,
		"",
		"Investor reached view limit",
		map[string]interface{}{
			"used_credits":  usedCredits,
			"total_credits": totalCredits,
		},
		"",
		"",
	)
}

// GetAuditLogs retrieves audit logs with filters
func (s *AuditService) GetAuditLogs(
	page, pageSize int,
	userID *uuid.UUID,
	action string,
	entityType string,
	startDate, endDate *time.Time,
) ([]models.AuditLog, int64, error) {
	db := database.GetDB()

	query := db.Model(&models.AuditLog{})

	if userID != nil {
		query = query.Where("user_id = ?", *userID)
	}

	if action != "" {
		query = query.Where("action = ?", action)
	}

	if entityType != "" {
		query = query.Where("entity_type = ?", entityType)
	}

	if startDate != nil {
		query = query.Where("created_at >= ?", *startDate)
	}

	if endDate != nil {
		query = query.Where("created_at <= ?", *endDate)
	}

	var total int64
	query.Count(&total)

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 50
	}

	var logs []models.AuditLog
	err := query.
		Order("created_at DESC").
		Offset((page - 1) * pageSize).
		Limit(pageSize).
		Find(&logs).Error

	return logs, total, err
}

// GetRecentActivity retrieves recent audit entries for dashboard
func (s *AuditService) GetRecentActivity(limit int) ([]models.RecentActivity, error) {
	db := database.GetDB()

	if limit < 1 || limit > 100 {
		limit = 20
	}

	var logs []models.AuditLog
	err := db.Order("created_at DESC").Limit(limit).Find(&logs).Error
	if err != nil {
		return nil, err
	}

	activities := make([]models.RecentActivity, len(logs))
	for i, log := range logs {
		activities[i] = models.RecentActivity{
			ID:          log.ID,
			Action:      log.Action,
			UserEmail:   log.UserEmail,
			EntityType:  log.EntityType,
			EntityName:  log.EntityName,
			Description: log.Description,
			CreatedAt:   log.CreatedAt,
		}
	}

	return activities, nil
}

// GetInvestorAccessHistory retrieves access history for an investor
func (s *AuditService) GetInvestorAccessHistory(investorID uuid.UUID, limit int) ([]models.InvestorAccessLog, error) {
	db := database.GetDB()

	if limit < 1 || limit > 100 {
		limit = 20
	}

	var logs []models.InvestorAccessLog
	err := db.Where("investor_id = ?", investorID).
		Order("session_start DESC").
		Limit(limit).
		Find(&logs).Error

	return logs, err
}

// GetProjectViewHistory retrieves view history for a project
func (s *AuditService) GetProjectViewHistory(projectID uuid.UUID) ([]models.ProjectViewLog, error) {
	db := database.GetDB()

	var logs []models.ProjectViewLog
	err := db.Where("project_id = ?", projectID).
		Preload("Investor").
		Order("viewed_at DESC").
		Find(&logs).Error

	return logs, err
}

// GetInvestorViewHistory retrieves view history for an investor
func (s *AuditService) GetInvestorViewHistory(investorID uuid.UUID) ([]models.ProjectViewLog, error) {
	db := database.GetDB()

	var logs []models.ProjectViewLog
	err := db.Where("investor_id = ?", investorID).
		Preload("Project").
		Order("viewed_at DESC").
		Find(&logs).Error

	return logs, err
}

// GetDashboardStats retrieves comprehensive dashboard statistics
func (s *AuditService) GetDashboardStats() (*models.DashboardStats, error) {
	db := database.GetDB()
	stats := &models.DashboardStats{}

	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	weekAgo := today.AddDate(0, 0, -7)
	monthAgo := today.AddDate(0, -1, 0)

	// User stats
	db.Model(&models.User{}).Count(&stats.TotalUsers)
	db.Model(&models.User{}).Where("role = ?", models.RoleInvestor).Count(&stats.TotalInvestors)
	db.Model(&models.User{}).Where("role = ?", models.RoleDeveloper).Count(&stats.TotalDevelopers)
	db.Model(&models.User{}).Where("role = ?", models.RoleAdmin).Count(&stats.TotalAdmins)
	db.Model(&models.User{}).Where("created_at >= ?", today).Count(&stats.NewUsersToday)
	db.Model(&models.User{}).Where("created_at >= ?", weekAgo).Count(&stats.NewUsersThisWeek)
	db.Model(&models.User{}).Where("created_at >= ?", monthAgo).Count(&stats.NewUsersThisMonth)
	db.Model(&models.User{}).Where("last_login_at >= ?", today).Count(&stats.ActiveUsersToday)

	// Project stats
	db.Model(&models.Project{}).Count(&stats.TotalProjects)
	db.Model(&models.Project{}).Where("status = ?", models.ProjectStatusDraft).Count(&stats.DraftProjects)
	db.Model(&models.Project{}).Where("status = ?", models.ProjectStatusPending).Count(&stats.PendingProjects)
	db.Model(&models.Project{}).Where("status = ?", models.ProjectStatusApproved).Count(&stats.ApprovedProjects)
	db.Model(&models.Project{}).Where("status = ?", models.ProjectStatusFunded).Count(&stats.FundedProjects)
	db.Model(&models.Project{}).Where("created_at >= ?", today).Count(&stats.NewProjectsToday)
	db.Model(&models.Project{}).Where("created_at >= ?", weekAgo).Count(&stats.NewProjectsThisWeek)

	// Payment stats
	db.Model(&models.Payment{}).Where("status = ?", models.PaymentStatusCompleted).Count(&stats.TotalPayments)

	var revenueTotal struct{ Total int64 }
	db.Model(&models.Payment{}).
		Where("status = ?", models.PaymentStatusCompleted).
		Select("COALESCE(SUM(amount), 0) as total").
		Scan(&revenueTotal)
	stats.TotalRevenue = revenueTotal.Total

	var revenueToday struct{ Total int64 }
	db.Model(&models.Payment{}).
		Where("status = ? AND completed_at >= ?", models.PaymentStatusCompleted, today).
		Select("COALESCE(SUM(amount), 0) as total").
		Scan(&revenueToday)
	stats.RevenueToday = revenueToday.Total

	var revenueWeek struct{ Total int64 }
	db.Model(&models.Payment{}).
		Where("status = ? AND completed_at >= ?", models.PaymentStatusCompleted, weekAgo).
		Select("COALESCE(SUM(amount), 0) as total").
		Scan(&revenueWeek)
	stats.RevenueThisWeek = revenueWeek.Total

	var revenueMonth struct{ Total int64 }
	db.Model(&models.Payment{}).
		Where("status = ? AND completed_at >= ?", models.PaymentStatusCompleted, monthAgo).
		Select("COALESCE(SUM(amount), 0) as total").
		Scan(&revenueMonth)
	stats.RevenueThisMonth = revenueMonth.Total

	// View stats
	db.Model(&models.ProjectViewLog{}).Count(&stats.TotalProjectViews)
	db.Model(&models.ProjectViewLog{}).Where("viewed_at >= ?", today).Count(&stats.ViewsToday)
	db.Model(&models.ProjectViewLog{}).Where("viewed_at >= ?", weekAgo).Count(&stats.ViewsThisWeek)

	// NDA stats
	db.Model(&models.NDA{}).Count(&stats.TotalNDAs)
	db.Model(&models.NDA{}).Where("signed_at >= ?", today).Count(&stats.NDAsToday)

	// Offer stats
	db.Model(&models.InvestmentOffer{}).Count(&stats.TotalOffers)
	db.Model(&models.InvestmentOffer{}).Where("status = ?", models.OfferStatusPending).Count(&stats.PendingOffers)
	db.Model(&models.InvestmentOffer{}).Where("status = ?", models.OfferStatusAccepted).Count(&stats.AcceptedOffers)

	return stats, nil
}

// GetInvestorDashboardStats retrieves stats for an investor's dashboard
func (s *AuditService) GetInvestorDashboardStats(investorID uuid.UUID) (*models.InvestorDashboardStats, error) {
	db := database.GetDB()
	stats := &models.InvestorDashboardStats{}

	// Get active payment and credit info
	var payment models.Payment
	err := db.Where("investor_id = ? AND status = ? AND projects_remaining > 0",
		investorID, models.PaymentStatusCompleted).
		Order("created_at DESC").
		First(&payment).Error

	if err == nil {
		stats.TotalCredits = payment.ProjectsTotal
		stats.UsedCredits = payment.ProjectsTotal - payment.ProjectsRemaining
		stats.RemainingCredits = payment.ProjectsRemaining
		stats.CanViewMore = payment.ProjectsRemaining > 0
		stats.NeedsPayment = false
	} else {
		stats.NeedsPayment = true
		stats.CanViewMore = false
	}

	// Count unlocked projects
	db.Model(&models.ProjectView{}).Where("investor_id = ?", investorID).Count(new(int64))
	var unlockedCount int64
	db.Model(&models.ProjectViewLog{}).
		Where("investor_id = ? AND is_unlock = ?", investorID, true).
		Count(&unlockedCount)
	stats.ProjectsUnlocked = int(unlockedCount)

	// Count offers
	var offersSubmitted int64
	db.Model(&models.InvestmentOffer{}).Where("investor_id = ?", investorID).Count(&offersSubmitted)
	stats.OffersSubmitted = int(offersSubmitted)

	var offersAccepted int64
	db.Model(&models.InvestmentOffer{}).
		Where("investor_id = ? AND status = ?", investorID, models.OfferStatusAccepted).
		Count(&offersAccepted)
	stats.OffersAccepted = int(offersAccepted)

	// NDA status
	var masterNDA models.NDA
	if err := db.Where("investor_id = ?", investorID).Order("signed_at DESC").First(&masterNDA).Error; err == nil {
		stats.HasMasterNDA = true
		stats.MasterNDAValid = masterNDA.IsValid()
	}

	return stats, nil
}
