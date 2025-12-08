package models

import (
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type UserRole string
type AuthProvider string

const (
	RoleInvestor  UserRole = "investor"
	RoleDeveloper UserRole = "developer"
	RoleAdmin     UserRole = "admin"

	AuthProviderEmail    AuthProvider = "email"
	AuthProviderGoogle   AuthProvider = "google"
	AuthProviderApple    AuthProvider = "apple"
	AuthProviderLinkedIn AuthProvider = "linkedin"
)

type User struct {
	ID               uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Email            string         `gorm:"uniqueIndex;not null" json:"email"`
	PasswordHash     string         `gorm:"column:password_hash" json:"-"`
	FirstName        string         `gorm:"not null" json:"first_name"`
	LastName         string         `gorm:"not null" json:"last_name"`
	CompanyName      string         `json:"company_name,omitempty"`
	Role             UserRole       `gorm:"type:varchar(20);not null;default:'investor'" json:"role"`
	
	// OAuth fields
	AuthProvider     AuthProvider   `gorm:"type:varchar(20);default:'email'" json:"auth_provider"`
	OAuthID          string         `gorm:"index" json:"-"`
	ProfileImageURL  string         `json:"profile_image_url,omitempty"`
	
	// Verification
	EmailVerified    bool           `gorm:"default:false" json:"email_verified"`
	EmailVerifyToken string         `gorm:"index" json:"-"`
	
	// Password Reset
	PasswordResetToken   string     `json:"-"`
	PasswordResetExpires *time.Time `json:"-"`
	
	// Status
	IsActive         bool           `gorm:"default:true" json:"is_active"`
	LastLoginAt      *time.Time     `json:"last_login_at,omitempty"`
	
	// Timestamps
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `gorm:"index" json:"-"`

	// Relations
	InvestorProfile  *InvestorProfile `gorm:"foreignKey:UserID" json:"investor_profile,omitempty"`
	Projects         []Project        `gorm:"foreignKey:DeveloperID" json:"projects,omitempty"`
	NDAs             []NDA            `gorm:"foreignKey:InvestorID" json:"ndas,omitempty"`
	Payments         []Payment        `gorm:"foreignKey:InvestorID" json:"payments,omitempty"`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == uuid.Nil {
		u.ID = uuid.New()
	}
	return nil
}

func (u *User) SetPassword(password string) error {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.PasswordHash = string(hash)
	return nil
}

func (u *User) CheckPassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.PasswordHash), []byte(password))
	return err == nil
}

func (u *User) FullName() string {
	return u.FirstName + " " + u.LastName
}

func (u *User) IsInvestor() bool {
	return u.Role == RoleInvestor
}

func (u *User) IsDeveloper() bool {
	return u.Role == RoleDeveloper
}

func (u *User) IsAdmin() bool {
	return u.Role == RoleAdmin
}

// UserResponse is the safe representation for API responses
type UserResponse struct {
	ID              uuid.UUID `json:"id"`
	Email           string    `json:"email"`
	FirstName       string    `json:"first_name"`
	LastName        string    `json:"last_name"`
	CompanyName     string    `json:"company_name,omitempty"`
	Role            UserRole  `json:"role"`
	AuthProvider    string    `json:"auth_provider"`
	ProfileImageURL string    `json:"profile_image_url,omitempty"`
	EmailVerified   bool      `json:"email_verified"`
	CreatedAt       time.Time `json:"created_at"`
}

func (u *User) ToResponse() UserResponse {
	return UserResponse{
		ID:              u.ID,
		Email:           u.Email,
		FirstName:       u.FirstName,
		LastName:        u.LastName,
		CompanyName:     u.CompanyName,
		Role:            u.Role,
		AuthProvider:    string(u.AuthProvider),
		ProfileImageURL: u.ProfileImageURL,
		EmailVerified:   u.EmailVerified,
		CreatedAt:       u.CreatedAt,
	}
}

// InvestorType represents whether investor is individual or institutional
type InvestorType string

const (
	InvestorTypePrivate       InvestorType = "private"
	InvestorTypeInstitutional InvestorType = "institutional"
)

// InvestorProfile holds additional investor-specific data
type InvestorProfile struct {
	ID                   uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	UserID               uuid.UUID      `gorm:"type:uuid;uniqueIndex;not null" json:"user_id"`
	
	// Investor Type
	InvestorType         InvestorType   `gorm:"type:varchar(20);default:'private'" json:"investor_type"`
	
	// Profile Info
	Bio                  string         `gorm:"type:text" json:"bio,omitempty"`
	LinkedInURL          string         `json:"linkedin_url,omitempty"`
	WebsiteURL           string         `json:"website_url,omitempty"`
	ProfileImageURL      string         `json:"profile_image_url,omitempty"`
	
	// Investment Preferences
	MinCheckSize         int64          `json:"min_check_size,omitempty"`
	MaxCheckSize         int64          `json:"max_check_size,omitempty"`
	FocusAreas           string         `json:"focus_areas,omitempty"` // comma-separated: fintech, healthtech, etc.
	PreferredStages      string         `json:"preferred_stages,omitempty"` // comma-separated: pre-seed, seed, series-a
	
	// Institutional Details (required for institutional investors)
	CompanyLegalName     string         `json:"company_legal_name,omitempty"`
	CompanyRegistration  string         `json:"company_registration,omitempty"` // Registration/incorporation number
	CompanyJurisdiction  string         `json:"company_jurisdiction,omitempty"` // Country/state of incorporation
	CompanyAddress       string         `gorm:"type:text" json:"company_address,omitempty"`
	CompanyCity          string         `json:"company_city,omitempty"`
	CompanyState         string         `json:"company_state,omitempty"`
	CompanyPostalCode    string         `json:"company_postal_code,omitempty"`
	CompanyCountry       string         `json:"company_country,omitempty"`
	TaxID                string         `json:"tax_id,omitempty"` // VAT/Tax ID for invoicing
	
	// Authorized Signatory (for institutional)
	SignatoryName        string         `json:"signatory_name,omitempty"`
	SignatoryTitle       string         `json:"signatory_title,omitempty"`
	SignatoryEmail       string         `json:"signatory_email,omitempty"`
	
	// Accreditation
	AccreditationStatus  string         `gorm:"type:varchar(20);default:'pending'" json:"accreditation_status"` // pending, verified, rejected
	AccreditationDoc     string         `json:"accreditation_doc,omitempty"`
	AccreditationDate    *time.Time     `json:"accreditation_date,omitempty"`
	
	// Stats
	TotalInvestments     int            `gorm:"default:0" json:"total_investments"`
	
	// Privacy
	IsProfilePublic      bool           `gorm:"default:false" json:"is_profile_public"` // Show to developers
	
	CreatedAt            time.Time      `json:"created_at"`
	UpdatedAt            time.Time      `json:"updated_at"`
	
	User                 *User          `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

func (ip *InvestorProfile) BeforeCreate(tx *gorm.DB) error {
	if ip.ID == uuid.Nil {
		ip.ID = uuid.New()
	}
	return nil
}

func (ip *InvestorProfile) IsInstitutional() bool {
	return ip.InvestorType == InvestorTypeInstitutional
}

func (ip *InvestorProfile) HasCompleteInstitutionalDetails() bool {
	if !ip.IsInstitutional() {
		return true // Not required for private investors
	}
	return ip.CompanyLegalName != "" &&
		ip.CompanyJurisdiction != "" &&
		ip.CompanyAddress != "" &&
		ip.CompanyCountry != ""
}

// ForNDA returns the profile info needed for NDA documents
func (ip *InvestorProfile) ForNDA() map[string]string {
	if ip.IsInstitutional() {
		return map[string]string{
			"type":         "institutional",
			"company_name": ip.CompanyLegalName,
			"registration": ip.CompanyRegistration,
			"jurisdiction": ip.CompanyJurisdiction,
			"address":      ip.CompanyAddress,
			"city":         ip.CompanyCity,
			"state":        ip.CompanyState,
			"postal_code":  ip.CompanyPostalCode,
			"country":      ip.CompanyCountry,
			"signatory":    ip.SignatoryName,
			"title":        ip.SignatoryTitle,
		}
	}
	return map[string]string{
		"type": "private",
	}
}

// ForInvoice returns details needed for invoicing
func (ip *InvestorProfile) ForInvoice() map[string]string {
	if ip.IsInstitutional() {
		return map[string]string{
			"company_name":  ip.CompanyLegalName,
			"address":       ip.CompanyAddress,
			"city":          ip.CompanyCity,
			"state":         ip.CompanyState,
			"postal_code":   ip.CompanyPostalCode,
			"country":       ip.CompanyCountry,
			"tax_id":        ip.TaxID,
			"contact_name":  ip.SignatoryName,
			"contact_email": ip.SignatoryEmail,
		}
	}
	return map[string]string{
		"type": "private",
	}
}
