package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type OfferStatus string

const (
	OfferStatusPending   OfferStatus = "pending"
	OfferStatusAccepted  OfferStatus = "accepted"
	OfferStatusRejected  OfferStatus = "rejected"
	OfferStatusWithdrawn OfferStatus = "withdrawn"
	OfferStatusExpired   OfferStatus = "expired"
)

type InvestmentOffer struct {
	ID              uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	InvestorID      uuid.UUID      `gorm:"type:uuid;not null;index" json:"investor_id"`
	ProjectID       uuid.UUID      `gorm:"type:uuid;not null;index" json:"project_id"`
	
	// Meeting Request (offers come after meetings)
	MeetingRequestID *uuid.UUID    `gorm:"type:uuid;index" json:"meeting_request_id,omitempty"`
	
	// Offer Details
	Amount          int64          `gorm:"not null" json:"amount"` // Amount in cents
	Currency        string         `gorm:"default:'usd'" json:"currency"`
	EquityRequested float64        `json:"equity_requested,omitempty"`
	ValuationCap    int64          `json:"valuation_cap,omitempty"`
	
	// Message
	Message         string         `gorm:"type:text" json:"message,omitempty"`
	
	// SAFE Note Terms (if applicable)
	IsSAFE          bool           `gorm:"default:true" json:"is_safe"`
	HasMFN          bool           `gorm:"default:false" json:"has_mfn"` // Most Favored Nation
	ProRataRights   bool           `gorm:"default:false" json:"pro_rata_rights"`
	DiscountRate    float64        `json:"discount_rate,omitempty"` // e.g., 0.20 for 20%
	
	// Status
	Status          OfferStatus    `gorm:"type:varchar(20);default:'pending'" json:"status"`
	ResponseMessage string         `gorm:"type:text" json:"response_message,omitempty"`
	
	// Timestamps
	ExpiresAt       *time.Time     `json:"expires_at,omitempty"`
	RespondedAt     *time.Time     `json:"responded_at,omitempty"`
	CreatedAt       time.Time      `json:"created_at"`
	UpdatedAt       time.Time      `json:"updated_at"`
	DeletedAt       gorm.DeletedAt `gorm:"index" json:"-"`
	
	// Relations
	Investor        *User          `gorm:"foreignKey:InvestorID" json:"investor,omitempty"`
	Project         *Project       `gorm:"foreignKey:ProjectID" json:"project,omitempty"`
	TermSheet       *TermSheet     `gorm:"foreignKey:OfferID" json:"term_sheet,omitempty"`
	MeetingRequest  *MeetingRequest `gorm:"foreignKey:MeetingRequestID" json:"meeting_request,omitempty"`
}

func (o *InvestmentOffer) BeforeCreate(tx *gorm.DB) error {
	if o.ID == uuid.Nil {
		o.ID = uuid.New()
	}
	return nil
}

func (o *InvestmentOffer) IsPending() bool {
	return o.Status == OfferStatusPending
}

func (o *InvestmentOffer) CanRespond() bool {
	if o.Status != OfferStatusPending {
		return false
	}
	if o.ExpiresAt != nil && time.Now().After(*o.ExpiresAt) {
		return false
	}
	return true
}

// TermSheet represents the formal SAFE note investment agreement
type TermSheetStatus string

const (
	TermSheetStatusDraft           TermSheetStatus = "draft"
	TermSheetStatusPendingInvestor TermSheetStatus = "pending_investor"
	TermSheetStatusPendingFounder  TermSheetStatus = "pending_founder"
	TermSheetStatusFullySigned     TermSheetStatus = "fully_signed"
	TermSheetStatusFundsReceived   TermSheetStatus = "funds_received"
	TermSheetStatusExpired         TermSheetStatus = "expired"
	TermSheetStatusCancelled       TermSheetStatus = "cancelled"
)

type TermSheet struct {
	ID                  uuid.UUID       `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	OfferID             uuid.UUID       `gorm:"type:uuid;uniqueIndex;not null" json:"offer_id"`
	
	// SAFE Note Terms
	InvestmentAmount    int64           `gorm:"not null" json:"investment_amount"` // Amount in cents
	Currency            string          `gorm:"default:'usd'" json:"currency"`
	ValuationCap        int64           `json:"valuation_cap,omitempty"`
	DiscountRate        float64         `json:"discount_rate,omitempty"` // e.g., 0.20 for 20%
	HasMFN              bool            `gorm:"default:false" json:"has_mfn"`
	ProRataRights       bool            `gorm:"default:false" json:"pro_rata_rights"`
	
	// Document
	DocumentURL         string          `json:"document_url,omitempty"`
	DocumentHash        string          `json:"document_hash,omitempty"`
	SAFEType            string          `gorm:"default:'post_money'" json:"safe_type"` // post_money, pre_money, mfn
	
	// Status
	Status              TermSheetStatus `gorm:"type:varchar(30);default:'draft'" json:"status"`
	
	// Investor Signature
	InvestorSignedName  string          `json:"investor_signed_name,omitempty"`
	InvestorSignature   string          `gorm:"type:text" json:"-"`
	InvestorSignedAt    *time.Time      `json:"investor_signed_at,omitempty"`
	InvestorIP          string          `json:"-"`
	
	// Founder Signature
	FounderSignedName   string          `json:"founder_signed_name,omitempty"`
	FounderSignature    string          `gorm:"type:text" json:"-"`
	FounderSignedAt     *time.Time      `json:"founder_signed_at,omitempty"`
	FounderIP           string          `json:"-"`
	
	// Funds Transfer Tracking
	FundsReceivedAt     *time.Time      `json:"funds_received_at,omitempty"`
	FundsConfirmedBy    *uuid.UUID      `gorm:"type:uuid" json:"funds_confirmed_by,omitempty"`
	BankReference       string          `json:"bank_reference,omitempty"`
	
	// Commission Tracking (for platform revenue)
	CommissionRate      float64         `gorm:"default:0.02" json:"commission_rate"` // 2% default
	CommissionAmount    int64           `json:"commission_amount"` // Calculated: InvestmentAmount * CommissionRate
	CommissionStatus    string          `gorm:"default:'pending'" json:"commission_status"` // pending, invoiced, paid
	CommissionInvoiceID *uuid.UUID      `gorm:"type:uuid" json:"commission_invoice_id,omitempty"`
	CommissionPaidAt    *time.Time      `json:"commission_paid_at,omitempty"`
	
	// Timestamps
	ExpiresAt           *time.Time      `json:"expires_at,omitempty"`
	CreatedAt           time.Time       `json:"created_at"`
	UpdatedAt           time.Time       `json:"updated_at"`
	
	// Relations
	Offer               *InvestmentOffer `gorm:"foreignKey:OfferID" json:"offer,omitempty"`
}

func (t *TermSheet) BeforeCreate(tx *gorm.DB) error {
	if t.ID == uuid.Nil {
		t.ID = uuid.New()
	}
	// Calculate commission
	t.CommissionAmount = int64(float64(t.InvestmentAmount) * t.CommissionRate)
	return nil
}

func (t *TermSheet) BeforeSave(tx *gorm.DB) error {
	// Recalculate commission on save
	t.CommissionAmount = int64(float64(t.InvestmentAmount) * t.CommissionRate)
	return nil
}

func (t *TermSheet) IsFullySigned() bool {
	return t.InvestorSignedAt != nil && t.FounderSignedAt != nil
}

func (t *TermSheet) NeedsInvestorSignature() bool {
	return t.InvestorSignedAt == nil
}

func (t *TermSheet) NeedsFounderSignature() bool {
	return t.InvestorSignedAt != nil && t.FounderSignedAt == nil
}

func (t *TermSheet) IsFundsReceived() bool {
	return t.FundsReceivedAt != nil
}

// CommissionDue returns the commission amount in formatted currency
func (t *TermSheet) CommissionDue() string {
	return FormatCurrency(t.CommissionAmount, t.Currency)
}

// PlatformCommission represents a commission invoice
type PlatformCommission struct {
	ID                uuid.UUID  `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	TermSheetID       uuid.UUID  `gorm:"type:uuid;not null;index" json:"term_sheet_id"`
	
	// Invoice Details
	InvoiceNumber     string     `gorm:"uniqueIndex" json:"invoice_number"`
	Amount            int64      `gorm:"not null" json:"amount"` // Commission amount in cents
	Currency          string     `gorm:"default:'usd'" json:"currency"`
	
	// Who to invoice (developer/startup)
	DeveloperID       uuid.UUID  `gorm:"type:uuid;not null;index" json:"developer_id"`
	
	// Billing Details (copied from project/developer)
	BillingName       string     `json:"billing_name"`
	BillingAddress    string     `gorm:"type:text" json:"billing_address"`
	BillingEmail      string     `json:"billing_email"`
	TaxID             string     `json:"tax_id,omitempty"`
	
	// Status
	Status            string     `gorm:"default:'draft'" json:"status"` // draft, sent, paid, overdue, cancelled
	
	// Payment
	DueDate           time.Time  `json:"due_date"`
	PaidAt            *time.Time `json:"paid_at,omitempty"`
	PaymentMethod     string     `json:"payment_method,omitempty"`
	PaymentReference  string     `json:"payment_reference,omitempty"`
	
	// Document
	InvoiceURL        string     `json:"invoice_url,omitempty"`
	
	// Timestamps
	SentAt            *time.Time `json:"sent_at,omitempty"`
	CreatedAt         time.Time  `json:"created_at"`
	UpdatedAt         time.Time  `json:"updated_at"`
	
	// Relations
	TermSheet         *TermSheet `gorm:"foreignKey:TermSheetID" json:"term_sheet,omitempty"`
	Developer         *User      `gorm:"foreignKey:DeveloperID" json:"developer,omitempty"`
}

func (pc *PlatformCommission) BeforeCreate(tx *gorm.DB) error {
	if pc.ID == uuid.Nil {
		pc.ID = uuid.New()
	}
	return nil
}

// OfferResponse for API
type OfferResponse struct {
	ID              uuid.UUID   `json:"id"`
	ProjectID       uuid.UUID   `json:"project_id"`
	ProjectTitle    string      `json:"project_title,omitempty"`
	InvestorID      uuid.UUID   `json:"investor_id"`
	InvestorName    string      `json:"investor_name,omitempty"`
	Amount          int64       `json:"amount"`
	AmountFormatted string      `json:"amount_formatted"`
	Status          OfferStatus `json:"status"`
	Message         string      `json:"message,omitempty"`
	HasTermSheet    bool        `json:"has_term_sheet"`
	TermSheetStatus string      `json:"term_sheet_status,omitempty"`
	CreatedAt       time.Time   `json:"created_at"`
}

func (o *InvestmentOffer) ToResponse() OfferResponse {
	resp := OfferResponse{
		ID:              o.ID,
		ProjectID:       o.ProjectID,
		InvestorID:      o.InvestorID,
		Amount:          o.Amount,
		AmountFormatted: FormatCurrency(o.Amount, o.Currency),
		Status:          o.Status,
		Message:         o.Message,
		HasTermSheet:    o.TermSheet != nil,
		CreatedAt:       o.CreatedAt,
	}
	
	if o.Project != nil {
		resp.ProjectTitle = o.Project.Title
	}
	if o.Investor != nil {
		resp.InvestorName = o.Investor.FullName()
	}
	if o.TermSheet != nil {
		resp.TermSheetStatus = string(o.TermSheet.Status)
	}
	
	return resp
}
