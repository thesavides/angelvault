package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// BusinessStage represents the current stage of the startup
type BusinessStage string

const (
	StageIdea       BusinessStage = "idea"
	StageMVP        BusinessStage = "mvp"
	StageBeta       BusinessStage = "beta"
	StageLaunched   BusinessStage = "launched"
	StageGrowth     BusinessStage = "growth"
	StageScaleUp    BusinessStage = "scale_up"
)

// ProjectReadiness captures the investment readiness of a project/startup
type ProjectReadiness struct {
	ID              uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	ProjectID       uuid.UUID      `gorm:"type:uuid;not null;uniqueIndex" json:"project_id"`
	
	// Business Stage
	Stage           BusinessStage  `gorm:"type:varchar(20);default:'idea'" json:"stage"`
	
	// Legal Entity
	HasLegalEntity       bool       `gorm:"default:false" json:"has_legal_entity"`
	LegalEntityType      string     `json:"legal_entity_type,omitempty"` // LLC, C-Corp, B.V., Ltd, etc.
	LegalEntityName      string     `json:"legal_entity_name,omitempty"`
	LegalJurisdiction    string     `json:"legal_jurisdiction,omitempty"` // Country/State
	IncorporationDate    *time.Time `json:"incorporation_date,omitempty"`
	RegistrationNumber   string     `json:"registration_number,omitempty"`
	
	// Product
	HasWorkingPOC        bool       `gorm:"default:false" json:"has_working_poc"`
	POCDescription       string     `gorm:"type:text" json:"poc_description,omitempty"`
	POCLink              string     `json:"poc_link,omitempty"` // Demo URL
	HasMVP               bool       `gorm:"default:false" json:"has_mvp"`
	MVPLaunchDate        *time.Time `json:"mvp_launch_date,omitempty"`
	HasPayingCustomers   bool       `gorm:"default:false" json:"has_paying_customers"`
	CustomerCount        int        `json:"customer_count,omitempty"`
	
	// Financial
	HasBankAccount       bool       `gorm:"default:false" json:"has_bank_account"`
	BankName             string     `json:"bank_name,omitempty"`
	BankCountry          string     `json:"bank_country,omitempty"`
	HasFinancialModel    bool       `gorm:"default:false" json:"has_financial_model"`
	FinancialModelURL    string     `json:"financial_model_url,omitempty"`
	HasRevenueProjections bool      `gorm:"default:false" json:"has_revenue_projections"`
	
	// Legal Documents
	HasShareholdersAgreement bool   `gorm:"default:false" json:"has_shareholders_agreement"`
	ShareholdersAgreementDate *time.Time `json:"shareholders_agreement_date,omitempty"`
	HasFoundersAgreement   bool     `gorm:"default:false" json:"has_founders_agreement"`
	HasIPAssignment        bool     `gorm:"default:false" json:"has_ip_assignment"` // IP assigned to company
	HasEmployeeContracts   bool     `gorm:"default:false" json:"has_employee_contracts"`
	
	// Cap Table
	HasCapTable            bool     `gorm:"default:false" json:"has_cap_table"`
	CapTableDocument       string   `json:"cap_table_document,omitempty"`
	TotalSharesAuthorized  int64    `json:"total_shares_authorized,omitempty"`
	FounderOwnership       float64  `json:"founder_ownership,omitempty"` // Percentage
	
	// Previous Funding
	HasPreviousFunding     bool     `gorm:"default:false" json:"has_previous_funding"`
	PreviousFundingAmount  int64    `json:"previous_funding_amount,omitempty"` // cents
	PreviousFundingType    string   `json:"previous_funding_type,omitempty"` // SAFE, equity, convertible, grant
	PreviousFundingDate    *time.Time `json:"previous_funding_date,omitempty"`
	
	// Team
	FullTimeFounders       int      `gorm:"default:0" json:"full_time_founders"`
	FullTimeEmployees      int      `gorm:"default:0" json:"full_time_employees"`
	PartTimeContractors    int      `gorm:"default:0" json:"part_time_contractors"`
	HasAdvisors            bool     `gorm:"default:false" json:"has_advisors"`
	AdvisorCount           int      `json:"advisor_count,omitempty"`
	
	// Compliance
	HasPrivacyPolicy       bool     `gorm:"default:false" json:"has_privacy_policy"`
	HasTermsOfService      bool     `gorm:"default:false" json:"has_terms_of_service"`
	IsGDPRCompliant        bool     `gorm:"default:false" json:"is_gdpr_compliant"`
	HasDataProcessingAgreement bool `gorm:"default:false" json:"has_data_processing_agreement"`
	
	// Additional Notes
	Notes                  string   `gorm:"type:text" json:"notes,omitempty"`
	
	// Verification
	VerifiedByAdmin        bool     `gorm:"default:false" json:"verified_by_admin"`
	VerifiedAt             *time.Time `json:"verified_at,omitempty"`
	VerifiedByID           *uuid.UUID `gorm:"type:uuid" json:"verified_by_id,omitempty"`
	
	// Timestamps
	CreatedAt              time.Time  `json:"created_at"`
	UpdatedAt              time.Time  `json:"updated_at"`
	
	// Relations
	Project                *Project   `gorm:"foreignKey:ProjectID" json:"project,omitempty"`
}

func (pr *ProjectReadiness) BeforeCreate(tx *gorm.DB) error {
	if pr.ID == uuid.Nil {
		pr.ID = uuid.New()
	}
	return nil
}

// ReadinessScore calculates a readiness score (0-100)
func (pr *ProjectReadiness) ReadinessScore() int {
	score := 0
	maxScore := 100
	
	// Legal Entity (20 points)
	if pr.HasLegalEntity {
		score += 20
	}
	
	// Product (20 points)
	if pr.HasWorkingPOC {
		score += 10
	}
	if pr.HasMVP {
		score += 5
	}
	if pr.HasPayingCustomers {
		score += 5
	}
	
	// Financial (20 points)
	if pr.HasBankAccount {
		score += 10
	}
	if pr.HasFinancialModel {
		score += 5
	}
	if pr.HasRevenueProjections {
		score += 5
	}
	
	// Legal Documents (25 points)
	if pr.HasShareholdersAgreement {
		score += 10
	}
	if pr.HasFoundersAgreement {
		score += 5
	}
	if pr.HasIPAssignment {
		score += 5
	}
	if pr.HasCapTable {
		score += 5
	}
	
	// Team (15 points)
	if pr.FullTimeFounders >= 2 {
		score += 10
	} else if pr.FullTimeFounders == 1 {
		score += 5
	}
	if pr.HasAdvisors {
		score += 5
	}
	
	if score > maxScore {
		score = maxScore
	}
	
	return score
}

// ReadinessLevel returns a human-readable readiness level
func (pr *ProjectReadiness) ReadinessLevel() string {
	score := pr.ReadinessScore()
	switch {
	case score >= 80:
		return "Investment Ready"
	case score >= 60:
		return "Nearly Ready"
	case score >= 40:
		return "In Progress"
	case score >= 20:
		return "Early Stage"
	default:
		return "Just Starting"
	}
}

// MissingRequirements returns a list of critical missing items
func (pr *ProjectReadiness) MissingRequirements() []string {
	missing := []string{}
	
	if !pr.HasLegalEntity {
		missing = append(missing, "Legal entity/incorporation")
	}
	if !pr.HasBankAccount {
		missing = append(missing, "Business bank account")
	}
	if !pr.HasShareholdersAgreement && pr.FullTimeFounders > 1 {
		missing = append(missing, "Shareholders agreement")
	}
	if !pr.HasWorkingPOC {
		missing = append(missing, "Working proof of concept")
	}
	if !pr.HasCapTable {
		missing = append(missing, "Cap table")
	}
	
	return missing
}

// ProjectReadinessResponse for API
type ProjectReadinessResponse struct {
	ID                  uuid.UUID     `json:"id"`
	ProjectID           uuid.UUID     `json:"project_id"`
	Stage               BusinessStage `json:"stage"`
	ReadinessScore      int           `json:"readiness_score"`
	ReadinessLevel      string        `json:"readiness_level"`
	MissingRequirements []string      `json:"missing_requirements"`
	HasLegalEntity      bool          `json:"has_legal_entity"`
	HasBankAccount      bool          `json:"has_bank_account"`
	HasWorkingPOC       bool          `json:"has_working_poc"`
	HasPayingCustomers  bool          `json:"has_paying_customers"`
	HasCapTable         bool          `json:"has_cap_table"`
	VerifiedByAdmin     bool          `json:"verified_by_admin"`
}

func (pr *ProjectReadiness) ToResponse() ProjectReadinessResponse {
	return ProjectReadinessResponse{
		ID:                  pr.ID,
		ProjectID:           pr.ProjectID,
		Stage:               pr.Stage,
		ReadinessScore:      pr.ReadinessScore(),
		ReadinessLevel:      pr.ReadinessLevel(),
		MissingRequirements: pr.MissingRequirements(),
		HasLegalEntity:      pr.HasLegalEntity,
		HasBankAccount:      pr.HasBankAccount,
		HasWorkingPOC:       pr.HasWorkingPOC,
		HasPayingCustomers:  pr.HasPayingCustomers,
		HasCapTable:         pr.HasCapTable,
		VerifiedByAdmin:     pr.VerifiedByAdmin,
	}
}
