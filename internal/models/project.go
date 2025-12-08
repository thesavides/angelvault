package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ProjectStatus string

const (
	ProjectStatusDraft    ProjectStatus = "draft"
	ProjectStatusPending  ProjectStatus = "pending"
	ProjectStatusApproved ProjectStatus = "approved"
	ProjectStatusRejected ProjectStatus = "rejected"
	ProjectStatusFunded   ProjectStatus = "funded"
	ProjectStatusClosed   ProjectStatus = "closed"
)

type Project struct {
	ID              uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	DeveloperID     uuid.UUID      `gorm:"type:uuid;not null;index" json:"developer_id"`
	CategoryID      uuid.UUID      `gorm:"type:uuid;not null;index" json:"category_id"`
	
	// Basic Info
	Title           string         `gorm:"not null" json:"title"`
	Tagline         string         `gorm:"size:200" json:"tagline"`
	Description     string         `gorm:"type:text" json:"description"`
	
	// Extended Info (unlocked view only)
	Problem         string         `gorm:"type:text" json:"problem,omitempty"`
	Solution        string         `gorm:"type:text" json:"solution,omitempty"`
	BusinessModel   string         `gorm:"type:text" json:"business_model,omitempty"`
	Traction        string         `gorm:"type:text" json:"traction,omitempty"`
	Competition     string         `gorm:"type:text" json:"competition,omitempty"`
	
	// Executive Summary (from PRD)
	ExecutiveSummary string        `gorm:"type:text" json:"executive_summary,omitempty"`
	UseOfFunds       string        `gorm:"type:text" json:"use_of_funds,omitempty"`
	
	// Financials
	CurrentRunway    int            `json:"current_runway,omitempty"` // months
	PreviousFunding  int64          `json:"previous_funding,omitempty"`
	MonthlyRevenue   int64          `json:"monthly_revenue,omitempty"`
	MRRGrowth        float64        `json:"mrr_growth,omitempty"` // percentage
	
	// Investment Terms
	MinInvestment    int64          `gorm:"not null" json:"min_investment"`
	MaxInvestment    int64          `json:"max_investment,omitempty"`
	EquityOffered    float64        `json:"equity_offered,omitempty"`
	ValuationCap     int64          `json:"valuation_cap,omitempty"`
	
	// Links
	WebsiteURL       string         `json:"website_url,omitempty"`
	POCURL           string         `json:"poc_url,omitempty"`
	PitchDeckURL     string         `json:"pitch_deck_url,omitempty"`
	DemoVideoURL     string         `json:"demo_video_url,omitempty"`
	FinancialModelURL string        `json:"financial_model_url,omitempty"`
	
	// Contact
	ContactEmail     string         `gorm:"not null" json:"contact_email"`
	ContactPhone     string         `json:"contact_phone,omitempty"`
	
	// Media
	PrimaryImage     string         `json:"primary_image,omitempty"`
	LogoURL          string         `json:"logo_url,omitempty"`
	
	// Status
	Status           ProjectStatus  `gorm:"type:varchar(20);default:'draft'" json:"status"`
	RejectionReason  string         `json:"rejection_reason,omitempty"`
	
	// Dates
	SubmittedAt      *time.Time     `json:"submitted_at,omitempty"`
	ApprovedAt       *time.Time     `json:"approved_at,omitempty"`
	FundedAt         *time.Time     `json:"funded_at,omitempty"`
	
	// Stats
	ViewCount        int            `gorm:"default:0" json:"view_count"`
	OfferCount       int            `gorm:"default:0" json:"offer_count"`
	
	// Timestamps
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"-"`
	
	// Relations
	Developer        *User           `gorm:"foreignKey:DeveloperID" json:"developer,omitempty"`
	Category         *Category       `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	TeamMembers      []TeamMember    `gorm:"foreignKey:ProjectID" json:"team_members,omitempty"`
	Images           []ProjectImage  `gorm:"foreignKey:ProjectID" json:"images,omitempty"`
	Offers           []InvestmentOffer `gorm:"foreignKey:ProjectID" json:"offers,omitempty"`
	NDAConfig        *ProjectNDAConfig `gorm:"foreignKey:ProjectID" json:"nda_config,omitempty"`
}

func (p *Project) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}

func (p *Project) IsPublished() bool {
	return p.Status == ProjectStatusApproved
}

func (p *Project) CanEdit() bool {
	return p.Status == ProjectStatusDraft || p.Status == ProjectStatusRejected
}

// ProjectPublicView is the limited view before unlock (for browsing)
type ProjectPublicView struct {
	ID            uuid.UUID     `json:"id"`
	Title         string        `json:"title"`
	Tagline       string        `json:"tagline"`
	CategoryID    uuid.UUID     `json:"category_id"`
	CategoryName  string        `json:"category_name"`
	MinInvestment int64         `json:"min_investment"`
	PrimaryImage  string        `json:"primary_image,omitempty"`
	LogoURL       string        `json:"logo_url,omitempty"`
	CreatedAt     time.Time     `json:"created_at"`
	IsUnlocked    bool          `json:"is_unlocked"`
}

func (p *Project) ToPublicView(categoryName string, isUnlocked bool) ProjectPublicView {
	return ProjectPublicView{
		ID:            p.ID,
		Title:         p.Title,
		Tagline:       p.Tagline,
		CategoryID:    p.CategoryID,
		CategoryName:  categoryName,
		MinInvestment: p.MinInvestment,
		PrimaryImage:  p.PrimaryImage,
		LogoURL:       p.LogoURL,
		CreatedAt:     p.CreatedAt,
		IsUnlocked:    isUnlocked,
	}
}

// TeamMember represents a project team member / founder / participant
type TeamMember struct {
	ID           uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	ProjectID    uuid.UUID      `gorm:"type:uuid;not null;index" json:"project_id"`
	
	// Name fields
	FirstName    string         `gorm:"not null" json:"first_name"`
	LastName     string         `gorm:"not null" json:"last_name"`
	
	// Role and bio
	Role         string         `gorm:"not null" json:"role"` // e.g., "CEO", "CTO", "Co-Founder"
	Bio          string         `json:"bio,omitempty"`
	
	// Profile links
	ImageURL     string         `json:"image_url,omitempty"`
	LinkedInURL  string         `json:"linkedin_url,omitempty"`
	WebsiteURL   string         `json:"website_url,omitempty"`
	
	// Primary contact designation
	IsPrimaryContact bool       `gorm:"default:false" json:"is_primary_contact"`
	
	// Contact details (only for primary contact)
	ContactEmail string         `json:"contact_email,omitempty"`
	ContactPhone string         `json:"contact_phone,omitempty"`
	
	// Display
	IsLead       bool           `gorm:"default:false" json:"is_lead"` // Lead founder
	DisplayOrder int            `gorm:"default:0" json:"display_order"`
	
	// Timestamps
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
}

// FullName returns the team member's full name
func (tm *TeamMember) FullName() string {
	return tm.FirstName + " " + tm.LastName
}

// ProjectImage represents project screenshots/media
type ProjectImage struct {
	ID           uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	ProjectID    uuid.UUID `gorm:"type:uuid;not null;index" json:"project_id"`
	URL          string    `gorm:"not null" json:"url"`
	ThumbnailURL string    `json:"thumbnail_url,omitempty"`
	Caption      string    `json:"caption,omitempty"`
	Description  string    `gorm:"type:text" json:"description,omitempty"`
	AltText      string    `json:"alt_text,omitempty"`
	DisplayOrder int       `gorm:"default:0" json:"display_order"`
	IsPrimary    bool      `gorm:"default:false" json:"is_primary"`
	ImageType    string    `gorm:"default:'screenshot'" json:"image_type"` // screenshot, logo, team, product, other
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
