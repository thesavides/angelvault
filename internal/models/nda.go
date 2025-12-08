package models

import (
	"crypto/sha256"
	"encoding/hex"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// NDA represents the master platform-wide NDA
type NDA struct {
	ID            uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	InvestorID    uuid.UUID      `gorm:"type:uuid;not null;index" json:"investor_id"`
	Version       string         `gorm:"not null;default:'1.0'" json:"version"`
	
	// Signature Info
	SignedName    string         `gorm:"not null" json:"signed_name"`
	SignatureData string         `gorm:"type:text;not null" json:"-"` // Base64 signature image
	IPAddress     string         `gorm:"not null" json:"ip_address"`
	UserAgent     string         `json:"-"`
	
	// Document hash for integrity
	DocumentHash  string         `gorm:"not null" json:"document_hash"`
	
	// Validity
	SignedAt      time.Time      `gorm:"not null" json:"signed_at"`
	ExpiresAt     time.Time      `gorm:"not null" json:"expires_at"`
	
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	
	// Relations
	Investor      *User          `gorm:"foreignKey:InvestorID" json:"investor,omitempty"`
}

func (n *NDA) BeforeCreate(tx *gorm.DB) error {
	if n.ID == uuid.Nil {
		n.ID = uuid.New()
	}
	return nil
}

func (n *NDA) IsValid() bool {
	return time.Now().Before(n.ExpiresAt)
}

// ProjectNDAConfig holds founder-specified NDA customizations
type ProjectNDAConfig struct {
	ID              uuid.UUID `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	ProjectID       uuid.UUID `gorm:"type:uuid;uniqueIndex;not null" json:"project_id"`
	
	// Custom terms the founder wants included
	CustomTerms     string    `gorm:"type:text" json:"custom_terms,omitempty"`
	
	// Specific IP/confidentiality clauses
	IPClauses       string    `gorm:"type:text" json:"ip_clauses,omitempty"`
	
	// Whether to require addendum (default true)
	RequireAddendum bool      `gorm:"default:true" json:"require_addendum"`
	
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
	
	Project         *Project  `gorm:"foreignKey:ProjectID" json:"project,omitempty"`
}

// ProjectNDASignature represents an investor's signed addendum for a specific project
type ProjectNDASignature struct {
	ID            uuid.UUID  `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	InvestorID    uuid.UUID  `gorm:"type:uuid;not null;index" json:"investor_id"`
	ProjectID     uuid.UUID  `gorm:"type:uuid;not null;index" json:"project_id"`
	MasterNDAID   uuid.UUID  `gorm:"type:uuid;not null" json:"master_nda_id"`
	ConfigID      *uuid.UUID `gorm:"type:uuid" json:"config_id,omitempty"`
	
	// Signature Info
	SignedName    string     `gorm:"not null" json:"signed_name"`
	SignatureData string     `gorm:"type:text;not null" json:"-"`
	IPAddress     string     `gorm:"not null" json:"ip_address"`
	UserAgent     string     `json:"-"`
	
	// Document hash at time of signing
	DocumentHash  string     `gorm:"not null" json:"document_hash"`
	
	SignedAt      time.Time  `gorm:"not null" json:"signed_at"`
	
	// Relations
	Investor      *User              `gorm:"foreignKey:InvestorID" json:"investor,omitempty"`
	Project       *Project           `gorm:"foreignKey:ProjectID" json:"project,omitempty"`
	MasterNDA     *NDA               `gorm:"foreignKey:MasterNDAID" json:"master_nda,omitempty"`
	Config        *ProjectNDAConfig  `gorm:"foreignKey:ConfigID" json:"config,omitempty"`
}

func (p *ProjectNDASignature) BeforeCreate(tx *gorm.DB) error {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}

// HashDocument creates a SHA256 hash of document content
func HashDocument(content string) string {
	hash := sha256.Sum256([]byte(content))
	return hex.EncodeToString(hash[:])
}

// NDA Status response for API
type NDAStatusResponse struct {
	HasMasterNDA     bool       `json:"has_master_nda"`
	MasterNDAValid   bool       `json:"master_nda_valid"`
	MasterNDAExpires *time.Time `json:"master_nda_expires,omitempty"`
	SignedAt         *time.Time `json:"signed_at,omitempty"`
}

// Project NDA status for viewing a project
type ProjectNDAStatusResponse struct {
	HasMasterNDA     bool       `json:"has_master_nda"`
	HasAddendum      bool       `json:"has_addendum"`
	RequiresAddendum bool       `json:"requires_addendum"`
	CanAccess        bool       `json:"can_access"`
	AddendumSignedAt *time.Time `json:"addendum_signed_at,omitempty"`
}

// Master NDA Template
const MasterNDATemplate = `
PLATFORM NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement ("Agreement") is entered into as of {{.SignedDate}}
between AngelVault Platform ("Platform") and the undersigned party ("Receiving Party").

1. CONFIDENTIAL INFORMATION
The Receiving Party agrees to maintain in confidence all information received through
the Platform regarding listed companies, including but not limited to:
- Business plans, strategies, and financial projections
- Technical specifications and intellectual property
- Customer information and partnerships
- Team member details and compensation structures
- Investment terms and cap table information

2. OBLIGATIONS
The Receiving Party agrees to:
a) Use Confidential Information solely for evaluating potential investments
b) Not disclose Confidential Information to third parties without written consent
c) Take reasonable measures to protect the confidentiality of such information
d) Not use Confidential Information for competitive purposes

3. EXCLUSIONS
This Agreement does not apply to information that:
a) Is or becomes publicly available through no fault of the Receiving Party
b) Was rightfully in the Receiving Party's possession prior to disclosure
c) Is independently developed by the Receiving Party
d) Is required to be disclosed by law

4. TERM
This Agreement shall remain in effect for {{.ValidityYears}} years from the date of signature.

5. GOVERNING LAW
This Agreement shall be governed by the laws of the State of Delaware.

AGREED AND ACCEPTED:

Signed: {{.SignedName}}
Date: {{.SignedDate}}
IP Address: {{.IPAddress}}
Document Version: {{.Version}}
`

// Project Addendum Template
const ProjectAddendumTemplate = `
PROJECT-SPECIFIC CONFIDENTIALITY ADDENDUM

This Addendum ("Addendum") supplements the Master Non-Disclosure Agreement
dated {{.MasterNDADate}} between the Receiving Party and AngelVault Platform.

PROJECT DETAILS:
- Project Name: {{.ProjectTitle}}
- Company: {{.CompanyName}}
- Addendum Date: {{.SignedDate}}

ADDITIONAL CONFIDENTIAL INFORMATION:
The Receiving Party acknowledges that the following project-specific information
constitutes Confidential Information under the Master NDA:

1. All business plans, financial projections, and valuations related to {{.ProjectTitle}}
2. Technical specifications, source code, and intellectual property
3. Customer lists, partnerships, and business relationships
4. Team member information and compensation details
5. Investment terms and cap table information

{{if .CustomTerms}}
ADDITIONAL TERMS SPECIFIED BY THE COMPANY:
{{.CustomTerms}}
{{end}}

{{if .IPClauses}}
INTELLECTUAL PROPERTY PROVISIONS:
{{.IPClauses}}
{{end}}

ACKNOWLEDGMENT:
By signing below, the Receiving Party confirms they have read and agree to this
Addendum, which incorporates by reference all terms of the Master NDA.

Signed: {{.SignedName}}
Date: {{.SignedDate}}
IP Address: {{.IPAddress}}
`
