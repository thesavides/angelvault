package models

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type PaymentStatus string

const (
	PaymentStatusPending   PaymentStatus = "pending"
	PaymentStatusCompleted PaymentStatus = "completed"
	PaymentStatusFailed    PaymentStatus = "failed"
	PaymentStatusRefunded  PaymentStatus = "refunded"
)

type Payment struct {
	ID                 uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	InvestorID         uuid.UUID      `gorm:"type:uuid;not null;index" json:"investor_id"`
	
	// Amount
	Amount             int64          `gorm:"not null" json:"amount"` // In cents
	Currency           string         `gorm:"not null;default:'usd'" json:"currency"`
	
	// Stripe
	StripePaymentID    string         `gorm:"index" json:"stripe_payment_id,omitempty"`
	StripeClientSecret string         `json:"-"`
	
	// Status
	Status             PaymentStatus  `gorm:"type:varchar(20);default:'pending'" json:"status"`
	
	// View Credits
	ProjectsTotal      int            `gorm:"not null" json:"projects_total"`
	ProjectsRemaining  int            `gorm:"not null" json:"projects_remaining"`
	
	// Metadata
	Description        string         `json:"description,omitempty"`
	ReceiptURL         string         `json:"receipt_url,omitempty"`
	
	// Timestamps
	CreatedAt          time.Time      `json:"created_at"`
	UpdatedAt          time.Time      `json:"updated_at"`
	CompletedAt        *time.Time     `json:"completed_at,omitempty"`
	DeletedAt          gorm.DeletedAt `gorm:"index" json:"-"`

	// Relations
	Investor           *User          `gorm:"foreignKey:InvestorID" json:"investor,omitempty"`
	Views              []ProjectView  `gorm:"foreignKey:PaymentID" json:"views,omitempty"`
}

func (p *Payment) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}

func (p *Payment) CanViewMore() bool {
	return p.Status == PaymentStatusCompleted && p.ProjectsRemaining > 0
}

func (p *Payment) UseCredit() bool {
	if p.ProjectsRemaining > 0 {
		p.ProjectsRemaining--
		return true
	}
	return false
}

// PaymentResponse for API
type PaymentResponse struct {
	ID                uuid.UUID     `json:"id"`
	Amount            int64         `json:"amount"`
	AmountFormatted   string        `json:"amount_formatted"`
	Currency          string        `json:"currency"`
	Status            PaymentStatus `json:"status"`
	ProjectsRemaining int           `json:"projects_remaining"`
	ProjectsTotal     int           `json:"projects_total"`
	ReceiptURL        string        `json:"receipt_url,omitempty"`
	CreatedAt         time.Time     `json:"created_at"`
	CompletedAt       *time.Time    `json:"completed_at,omitempty"`
}

func (p *Payment) ToResponse() PaymentResponse {
	return PaymentResponse{
		ID:                p.ID,
		Amount:            p.Amount,
		AmountFormatted:   FormatCurrency(p.Amount, p.Currency),
		Currency:          p.Currency,
		Status:            p.Status,
		ProjectsRemaining: p.ProjectsRemaining,
		ProjectsTotal:     p.ProjectsTotal,
		ReceiptURL:        p.ReceiptURL,
		CreatedAt:         p.CreatedAt,
		CompletedAt:       p.CompletedAt,
	}
}

// ProjectView records which projects an investor has unlocked
type ProjectView struct {
	ID          uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	InvestorID  uuid.UUID `gorm:"type:uuid;not null;index" json:"investor_id"`
	ProjectID   uuid.UUID `gorm:"type:uuid;not null;index" json:"project_id"`
	PaymentID   uuid.UUID `gorm:"type:uuid;not null;index" json:"payment_id"`
	ViewedAt    time.Time `gorm:"not null" json:"viewed_at"`
	
	// Relations
	Investor    *User     `gorm:"foreignKey:InvestorID" json:"investor,omitempty"`
	Project     *Project  `gorm:"foreignKey:ProjectID" json:"project,omitempty"`
	Payment     *Payment  `gorm:"foreignKey:PaymentID" json:"payment,omitempty"`
}

func (v *ProjectView) BeforeCreate(tx *gorm.DB) error {
	if v.ID == uuid.Nil {
		v.ID = uuid.New()
	}
	if v.ViewedAt.IsZero() {
		v.ViewedAt = time.Now()
	}
	return nil
}

// PaymentStatusResponse for dashboard
type PaymentStatusResponse struct {
	HasActivePayment  bool            `json:"has_active_payment"`
	Payment           *PaymentResponse `json:"payment,omitempty"`
	ProjectsRemaining int             `json:"projects_remaining"`
	ProjectsTotal     int             `json:"projects_total"`
	Message           string          `json:"message,omitempty"`
}

// Helper function
func FormatCurrency(amount int64, currency string) string {
	major := float64(amount) / 100
	formatted := fmt.Sprintf("%.2f", major)
	switch currency {
	case "zar":
		return "R" + formatted
	case "eur":
		return "€" + formatted
	case "gbp":
		return "£" + formatted
	default:
		return "$" + formatted
	}
}
