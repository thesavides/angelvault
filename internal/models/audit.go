package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// AuditAction represents the type of action being audited
type AuditAction string

const (
	// User actions
	AuditActionUserRegistered     AuditAction = "user.registered"
	AuditActionUserLogin          AuditAction = "user.login"
	AuditActionUserLogout         AuditAction = "user.logout"
	AuditActionUserProfileUpdated AuditAction = "user.profile_updated"
	AuditActionUserPasswordChanged AuditAction = "user.password_changed"
	AuditActionUserDeactivated    AuditAction = "user.deactivated"
	AuditActionUserReactivated    AuditAction = "user.reactivated"
	
	// Admin user actions
	AuditActionAdminCreated       AuditAction = "admin.created"
	AuditActionAdminUpdated       AuditAction = "admin.updated"
	AuditActionAdminDeleted       AuditAction = "admin.deleted"
	
	// Project actions
	AuditActionProjectCreated     AuditAction = "project.created"
	AuditActionProjectUpdated     AuditAction = "project.updated"
	AuditActionProjectSubmitted   AuditAction = "project.submitted"
	AuditActionProjectApproved    AuditAction = "project.approved"
	AuditActionProjectRejected    AuditAction = "project.rejected"
	AuditActionProjectDeleted     AuditAction = "project.deleted"
	AuditActionProjectViewed      AuditAction = "project.viewed"
	AuditActionProjectUnlocked    AuditAction = "project.unlocked"
	
	// Investor actions
	AuditActionInvestorAccess     AuditAction = "investor.access"
	AuditActionInvestorViewLimit  AuditAction = "investor.view_limit_reached"
	
	// Payment actions
	AuditActionPaymentCreated     AuditAction = "payment.created"
	AuditActionPaymentCompleted   AuditAction = "payment.completed"
	AuditActionPaymentFailed      AuditAction = "payment.failed"
	AuditActionPaymentRefunded    AuditAction = "payment.refunded"
	AuditActionCreditsUsed        AuditAction = "payment.credits_used"
	AuditActionCreditsExpired     AuditAction = "payment.credits_expired"
	
	// NDA actions
	AuditActionNDAMasterSigned    AuditAction = "nda.master_signed"
	AuditActionNDAAddendumSigned  AuditAction = "nda.addendum_signed"
	
	// Offer actions
	AuditActionOfferCreated       AuditAction = "offer.created"
	AuditActionOfferAccepted      AuditAction = "offer.accepted"
	AuditActionOfferRejected      AuditAction = "offer.rejected"
	AuditActionOfferWithdrawn     AuditAction = "offer.withdrawn"
	
	// Category actions
	AuditActionCategoryCreated    AuditAction = "category.created"
	AuditActionCategoryUpdated    AuditAction = "category.updated"
	AuditActionCategoryDeleted    AuditAction = "category.deleted"
)

// AuditLog represents a single audit trail entry
type AuditLog struct {
	ID            uuid.UUID   `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	
	// Who performed the action
	UserID        *uuid.UUID  `gorm:"type:uuid;index" json:"user_id,omitempty"`
	UserEmail     string      `json:"user_email,omitempty"`
	UserRole      UserRole    `json:"user_role,omitempty"`
	
	// What action was performed
	Action        AuditAction `gorm:"type:varchar(50);not null;index" json:"action"`
	
	// What entity was affected
	EntityType    string      `gorm:"type:varchar(50);index" json:"entity_type"` // user, project, payment, etc.
	EntityID      *uuid.UUID  `gorm:"type:uuid;index" json:"entity_id,omitempty"`
	EntityName    string      `json:"entity_name,omitempty"` // Human readable name
	
	// Additional context
	Description   string      `gorm:"type:text" json:"description"`
	Metadata      string      `gorm:"type:jsonb" json:"metadata,omitempty"` // JSON for extra data
	
	// Request context
	IPAddress     string      `json:"ip_address,omitempty"`
	UserAgent     string      `json:"user_agent,omitempty"`
	RequestID     string      `json:"request_id,omitempty"`
	
	// Timing
	CreatedAt     time.Time   `gorm:"index" json:"created_at"`
}

func (a *AuditLog) BeforeCreate(tx *gorm.DB) error {
	if a.ID == uuid.Nil {
		a.ID = uuid.New()
	}
	return nil
}

// InvestorAccessLog tracks when investors access the platform and view projects
type InvestorAccessLog struct {
	ID            uuid.UUID  `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	InvestorID    uuid.UUID  `gorm:"type:uuid;not null;index" json:"investor_id"`
	
	// Session info
	SessionStart  time.Time  `gorm:"not null" json:"session_start"`
	SessionEnd    *time.Time `json:"session_end,omitempty"`
	
	// Activity metrics
	ProjectsViewed    int    `gorm:"default:0" json:"projects_viewed"`
	ProjectsUnlocked  int    `gorm:"default:0" json:"projects_unlocked"`
	OffersSubmitted   int    `gorm:"default:0" json:"offers_submitted"`
	
	// Context
	IPAddress     string     `json:"ip_address,omitempty"`
	UserAgent     string     `json:"user_agent,omitempty"`
	
	// Timestamps
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
	
	// Relations
	Investor      *User      `gorm:"foreignKey:InvestorID" json:"investor,omitempty"`
}

// ProjectViewLog tracks individual project views with timing
type ProjectViewLog struct {
	ID            uuid.UUID  `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	InvestorID    uuid.UUID  `gorm:"type:uuid;not null;index" json:"investor_id"`
	ProjectID     uuid.UUID  `gorm:"type:uuid;not null;index" json:"project_id"`
	PaymentID     *uuid.UUID `gorm:"type:uuid;index" json:"payment_id,omitempty"`
	
	// View details
	ViewedAt      time.Time  `gorm:"not null" json:"viewed_at"`
	TimeSpent     int        `json:"time_spent_seconds,omitempty"` // How long they viewed
	
	// What triggered the view
	IsUnlock      bool       `gorm:"default:false" json:"is_unlock"` // Was this an unlock or re-view
	CreditUsed    bool       `gorm:"default:false" json:"credit_used"`
	
	// Context
	IPAddress     string     `json:"ip_address,omitempty"`
	
	// Relations
	Investor      *User      `gorm:"foreignKey:InvestorID" json:"investor,omitempty"`
	Project       *Project   `gorm:"foreignKey:ProjectID" json:"project,omitempty"`
}

// DashboardStats represents aggregated statistics for admin dashboard
type DashboardStats struct {
	// User stats
	TotalUsers        int64 `json:"total_users"`
	TotalInvestors    int64 `json:"total_investors"`
	TotalDevelopers   int64 `json:"total_developers"`
	TotalAdmins       int64 `json:"total_admins"`
	NewUsersToday     int64 `json:"new_users_today"`
	NewUsersThisWeek  int64 `json:"new_users_this_week"`
	NewUsersThisMonth int64 `json:"new_users_this_month"`
	ActiveUsersToday  int64 `json:"active_users_today"`
	
	// Project stats
	TotalProjects     int64 `json:"total_projects"`
	DraftProjects     int64 `json:"draft_projects"`
	PendingProjects   int64 `json:"pending_projects"`
	ApprovedProjects  int64 `json:"approved_projects"`
	FundedProjects    int64 `json:"funded_projects"`
	NewProjectsToday  int64 `json:"new_projects_today"`
	NewProjectsThisWeek int64 `json:"new_projects_this_week"`
	
	// Payment stats
	TotalPayments     int64 `json:"total_payments"`
	TotalRevenue      int64 `json:"total_revenue"` // cents
	RevenueToday      int64 `json:"revenue_today"`
	RevenueThisWeek   int64 `json:"revenue_this_week"`
	RevenueThisMonth  int64 `json:"revenue_this_month"`
	
	// Activity stats
	TotalProjectViews int64 `json:"total_project_views"`
	ViewsToday        int64 `json:"views_today"`
	ViewsThisWeek     int64 `json:"views_this_week"`
	
	// NDA stats
	TotalNDAs         int64 `json:"total_ndas"`
	NDAsToday         int64 `json:"ndas_today"`
	
	// Offer stats
	TotalOffers       int64 `json:"total_offers"`
	PendingOffers     int64 `json:"pending_offers"`
	AcceptedOffers    int64 `json:"accepted_offers"`
}

// RecentActivity represents recent audit entries for dashboard
type RecentActivity struct {
	ID          uuid.UUID   `json:"id"`
	Action      AuditAction `json:"action"`
	UserEmail   string      `json:"user_email"`
	EntityType  string      `json:"entity_type"`
	EntityName  string      `json:"entity_name"`
	Description string      `json:"description"`
	CreatedAt   time.Time   `json:"created_at"`
}

// InvestorDashboardStats represents stats for an individual investor
type InvestorDashboardStats struct {
	// Credit balance
	TotalCredits      int  `json:"total_credits"`
	UsedCredits       int  `json:"used_credits"`
	RemainingCredits  int  `json:"remaining_credits"`
	
	// Activity
	ProjectsUnlocked  int  `json:"projects_unlocked"`
	OffersSubmitted   int  `json:"offers_submitted"`
	OffersAccepted    int  `json:"offers_accepted"`
	
	// NDA status
	HasMasterNDA      bool `json:"has_master_nda"`
	MasterNDAValid    bool `json:"master_nda_valid"`
	
	// Payment needed
	NeedsPayment      bool `json:"needs_payment"`
	CanViewMore       bool `json:"can_view_more"`
}
