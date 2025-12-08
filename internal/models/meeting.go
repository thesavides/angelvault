package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// MeetingRequestStatus represents the status of a meeting request
type MeetingRequestStatus string

const (
	MeetingStatusPending   MeetingRequestStatus = "pending"
	MeetingStatusAccepted  MeetingRequestStatus = "accepted"
	MeetingStatusDeclined  MeetingRequestStatus = "declined"
	MeetingStatusCancelled MeetingRequestStatus = "cancelled"
	MeetingStatusCompleted MeetingRequestStatus = "completed"
	MeetingStatusExpired   MeetingRequestStatus = "expired"
)

// MeetingRequest represents a request from an investor to meet with a development team
type MeetingRequest struct {
	ID            uuid.UUID            `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	InvestorID    uuid.UUID            `gorm:"type:uuid;not null;index" json:"investor_id"`
	ProjectID     uuid.UUID            `gorm:"type:uuid;not null;index" json:"project_id"`
	
	// Request details
	Message       string               `gorm:"type:text" json:"message"` // Why they want to meet
	ProposedTimes string               `gorm:"type:text" json:"proposed_times"` // Suggested meeting times
	MeetingType   string               `gorm:"default:'video'" json:"meeting_type"` // video, phone, in_person
	
	// Status
	Status        MeetingRequestStatus `gorm:"type:varchar(20);default:'pending'" json:"status"`
	
	// Developer response
	ResponseMessage string             `json:"response_message,omitempty"`
	ScheduledAt     *time.Time         `json:"scheduled_at,omitempty"`
	MeetingLink     string             `json:"meeting_link,omitempty"` // Zoom/Meet link
	
	// NDA tracking - investor signs addendum when requesting, developer signs when accepting
	InvestorNDASignedAt  *time.Time    `json:"investor_nda_signed_at,omitempty"`
	DeveloperNDASignedAt *time.Time    `json:"developer_nda_signed_at,omitempty"`
	
	// Timestamps
	RequestedAt   time.Time            `json:"requested_at"`
	RespondedAt   *time.Time           `json:"responded_at,omitempty"`
	CompletedAt   *time.Time           `json:"completed_at,omitempty"`
	ExpiresAt     time.Time            `json:"expires_at"` // Auto-expire if not responded
	
	CreatedAt     time.Time            `json:"created_at"`
	UpdatedAt     time.Time            `json:"updated_at"`
	DeletedAt     gorm.DeletedAt       `gorm:"index" json:"-"`
	
	// Relations
	Investor      *User                `gorm:"foreignKey:InvestorID" json:"investor,omitempty"`
	Project       *Project             `gorm:"foreignKey:ProjectID" json:"project,omitempty"`
}

func (m *MeetingRequest) BeforeCreate(tx *gorm.DB) error {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	m.RequestedAt = time.Now()
	// Default expiry: 14 days
	if m.ExpiresAt.IsZero() {
		m.ExpiresAt = time.Now().AddDate(0, 0, 14)
	}
	return nil
}

func (m *MeetingRequest) IsPending() bool {
	return m.Status == MeetingStatusPending
}

func (m *MeetingRequest) CanRespond() bool {
	return m.Status == MeetingStatusPending && time.Now().Before(m.ExpiresAt)
}

func (m *MeetingRequest) IsExpired() bool {
	return time.Now().After(m.ExpiresAt) && m.Status == MeetingStatusPending
}

// Message represents a message in the meeting request thread
type Message struct {
	ID              uuid.UUID  `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	MeetingRequestID uuid.UUID `gorm:"type:uuid;not null;index" json:"meeting_request_id"`
	SenderID        uuid.UUID  `gorm:"type:uuid;not null" json:"sender_id"`
	SenderRole      UserRole   `json:"sender_role"` // investor or developer
	
	Content         string     `gorm:"type:text;not null" json:"content"`
	IsRead          bool       `gorm:"default:false" json:"is_read"`
	ReadAt          *time.Time `json:"read_at,omitempty"`
	
	CreatedAt       time.Time  `json:"created_at"`
	
	// Relations
	Sender          *User      `gorm:"foreignKey:SenderID" json:"sender,omitempty"`
}

// MeetingRequestResponse for API responses
type MeetingRequestResponse struct {
	ID              uuid.UUID            `json:"id"`
	ProjectID       uuid.UUID            `json:"project_id"`
	ProjectTitle    string               `json:"project_title"`
	InvestorName    string               `json:"investor_name"`
	InvestorCompany string               `json:"investor_company,omitempty"`
	Message         string               `json:"message"`
	Status          MeetingRequestStatus `json:"status"`
	RequestedAt     time.Time            `json:"requested_at"`
	ScheduledAt     *time.Time           `json:"scheduled_at,omitempty"`
	MeetingLink     string               `json:"meeting_link,omitempty"`
	InvestorNDASigned  bool              `json:"investor_nda_signed"`
	DeveloperNDASigned bool              `json:"developer_nda_signed"`
}

func (m *MeetingRequest) ToResponse() MeetingRequestResponse {
	resp := MeetingRequestResponse{
		ID:          m.ID,
		ProjectID:   m.ProjectID,
		Message:     m.Message,
		Status:      m.Status,
		RequestedAt: m.RequestedAt,
		ScheduledAt: m.ScheduledAt,
		MeetingLink: m.MeetingLink,
		InvestorNDASigned:  m.InvestorNDASignedAt != nil,
		DeveloperNDASigned: m.DeveloperNDASignedAt != nil,
	}
	
	if m.Project != nil {
		resp.ProjectTitle = m.Project.Title
	}
	
	if m.Investor != nil {
		resp.InvestorName = m.Investor.FullName()
		resp.InvestorCompany = m.Investor.CompanyName
	}
	
	return resp
}
