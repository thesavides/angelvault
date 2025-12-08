package services

import (
	"bytes"
	"errors"
	"text/template"
	"time"

	"github.com/google/uuid"
	"github.com/ukuvago/angelvault/internal/config"
	"github.com/ukuvago/angelvault/internal/database"
	"github.com/ukuvago/angelvault/internal/models"
)

type NDAService struct {
	config *config.Config
}

func NewNDAService(cfg *config.Config) *NDAService {
	return &NDAService{config: cfg}
}

// SignNDARequest represents the request to sign an NDA
type SignNDARequest struct {
	SignedName    string `json:"signed_name" binding:"required"`
	SignatureData string `json:"signature_data" binding:"required"`
}

// GetMasterNDAStatus returns the investor's master NDA status
func (s *NDAService) GetMasterNDAStatus(investorID uuid.UUID) *models.NDAStatusResponse {
	db := database.GetDB()

	var nda models.NDA
	err := db.Where("investor_id = ?", investorID).
		Order("signed_at DESC").
		First(&nda).Error

	if err != nil {
		return &models.NDAStatusResponse{
			HasMasterNDA:   false,
			MasterNDAValid: false,
		}
	}

	return &models.NDAStatusResponse{
		HasMasterNDA:     true,
		MasterNDAValid:   nda.IsValid(),
		MasterNDAExpires: &nda.ExpiresAt,
		SignedAt:         &nda.SignedAt,
	}
}

// GetMasterNDAContent generates the NDA content for display/signing
func (s *NDAService) GetMasterNDAContent(investorID uuid.UUID) (string, error) {
	db := database.GetDB()

	var investor models.User
	if err := db.First(&investor, "id = ?", investorID).Error; err != nil {
		return "", errors.New("investor not found")
	}

	data := map[string]interface{}{
		"SignedName":    investor.FullName(),
		"SignedDate":    time.Now().Format("January 2, 2006"),
		"ValidityYears": s.config.NDAValidityYears,
		"Version":       "1.0",
		"IPAddress":     "[to be recorded]",
	}

	tmpl, err := template.New("nda").Parse(models.MasterNDATemplate)
	if err != nil {
		return "", err
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		return "", err
	}

	return buf.String(), nil
}

// SignMasterNDA signs the master platform NDA
func (s *NDAService) SignMasterNDA(investorID uuid.UUID, req *SignNDARequest, ipAddress, userAgent string) (*models.NDA, error) {
	db := database.GetDB()

	// Check if already has valid NDA
	var existing models.NDA
	err := db.Where("investor_id = ?", investorID).
		Order("signed_at DESC").
		First(&existing).Error
	if err == nil && existing.IsValid() {
		return nil, errors.New("you already have a valid NDA")
	}

	// Generate document content
	content, err := s.GetMasterNDAContent(investorID)
	if err != nil {
		return nil, err
	}

	// Create NDA record
	nda := &models.NDA{
		InvestorID:    investorID,
		Version:       "1.0",
		SignedName:    req.SignedName,
		SignatureData: req.SignatureData,
		IPAddress:     ipAddress,
		UserAgent:     userAgent,
		DocumentHash:  models.HashDocument(content),
		SignedAt:      time.Now(),
		ExpiresAt:     time.Now().AddDate(s.config.NDAValidityYears, 0, 0),
	}

	if err := db.Create(nda).Error; err != nil {
		return nil, err
	}

	return nda, nil
}

// GetProjectNDAStatus returns the NDA status for a specific project
func (s *NDAService) GetProjectNDAStatus(investorID, projectID uuid.UUID) *models.ProjectNDAStatusResponse {
	db := database.GetDB()

	// Check master NDA
	var masterNDA models.NDA
	hasMasterNDA := db.Where("investor_id = ?", investorID).
		Order("signed_at DESC").
		First(&masterNDA).Error == nil && masterNDA.IsValid()

	// Check project addendum
	var addendum models.ProjectNDASignature
	hasAddendum := db.Where("investor_id = ? AND project_id = ?", investorID, projectID).
		First(&addendum).Error == nil

	// Check if project requires addendum
	var config models.ProjectNDAConfig
	requiresAddendum := true
	if err := db.Where("project_id = ?", projectID).First(&config).Error; err == nil {
		requiresAddendum = config.RequireAddendum
	}

	canAccess := hasMasterNDA && (!requiresAddendum || hasAddendum)

	resp := &models.ProjectNDAStatusResponse{
		HasMasterNDA:     hasMasterNDA,
		HasAddendum:      hasAddendum,
		RequiresAddendum: requiresAddendum,
		CanAccess:        canAccess,
	}

	if hasAddendum {
		resp.AddendumSignedAt = &addendum.SignedAt
	}

	return resp
}

// GetProjectAddendumContent generates the addendum content
func (s *NDAService) GetProjectAddendumContent(investorID, projectID uuid.UUID) (string, error) {
	db := database.GetDB()

	// Get master NDA
	var masterNDA models.NDA
	if err := db.Where("investor_id = ?", investorID).
		Order("signed_at DESC").
		First(&masterNDA).Error; err != nil {
		return "", errors.New("master NDA not found")
	}

	if !masterNDA.IsValid() {
		return "", errors.New("master NDA has expired")
	}

	// Get project
	var project models.Project
	if err := db.Preload("Developer").First(&project, "id = ?", projectID).Error; err != nil {
		return "", errors.New("project not found")
	}

	// Get project NDA config if exists
	var config models.ProjectNDAConfig
	db.Where("project_id = ?", projectID).First(&config)

	// Get investor
	var investor models.User
	if err := db.First(&investor, "id = ?", investorID).Error; err != nil {
		return "", errors.New("investor not found")
	}

	companyName := project.Title
	if project.Developer != nil && project.Developer.CompanyName != "" {
		companyName = project.Developer.CompanyName
	}

	data := map[string]interface{}{
		"MasterNDADate": masterNDA.SignedAt.Format("January 2, 2006"),
		"ProjectTitle":  project.Title,
		"CompanyName":   companyName,
		"SignedDate":    time.Now().Format("January 2, 2006"),
		"SignedName":    investor.FullName(),
		"IPAddress":     "[to be recorded]",
		"CustomTerms":   config.CustomTerms,
		"IPClauses":     config.IPClauses,
	}

	tmpl, err := template.New("addendum").Parse(models.ProjectAddendumTemplate)
	if err != nil {
		return "", err
	}

	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		return "", err
	}

	return buf.String(), nil
}

// SignProjectAddendum signs the project-specific NDA addendum
func (s *NDAService) SignProjectAddendum(investorID, projectID uuid.UUID, req *SignNDARequest, ipAddress, userAgent string) (*models.ProjectNDASignature, error) {
	db := database.GetDB()

	// Verify master NDA exists and is valid
	var masterNDA models.NDA
	if err := db.Where("investor_id = ?", investorID).
		Order("signed_at DESC").
		First(&masterNDA).Error; err != nil {
		return nil, errors.New("master NDA required before signing project addendum")
	}

	if !masterNDA.IsValid() {
		return nil, errors.New("master NDA has expired")
	}

	// Check if already signed
	var existing models.ProjectNDASignature
	if err := db.Where("investor_id = ? AND project_id = ?", investorID, projectID).
		First(&existing).Error; err == nil {
		return nil, errors.New("addendum already signed for this project")
	}

	// Get project config
	var config models.ProjectNDAConfig
	var configID *uuid.UUID
	if err := db.Where("project_id = ?", projectID).First(&config).Error; err == nil {
		configID = &config.ID
	}

	// Generate addendum content
	content, err := s.GetProjectAddendumContent(investorID, projectID)
	if err != nil {
		return nil, err
	}

	// Create signature record
	signature := &models.ProjectNDASignature{
		InvestorID:    investorID,
		ProjectID:     projectID,
		MasterNDAID:   masterNDA.ID,
		ConfigID:      configID,
		SignedName:    req.SignedName,
		SignatureData: req.SignatureData,
		IPAddress:     ipAddress,
		UserAgent:     userAgent,
		DocumentHash:  models.HashDocument(content),
		SignedAt:      time.Now(),
	}

	if err := db.Create(signature).Error; err != nil {
		return nil, err
	}

	return signature, nil
}

// UpdateProjectNDAConfig updates the NDA config for a project
func (s *NDAService) UpdateProjectNDAConfig(projectID uuid.UUID, customTerms, ipClauses string, requireAddendum bool) error {
	db := database.GetDB()

	var config models.ProjectNDAConfig
	err := db.Where("project_id = ?", projectID).First(&config).Error

	if err != nil {
		// Create new config
		config = models.ProjectNDAConfig{
			ProjectID:       projectID,
			CustomTerms:     customTerms,
			IPClauses:       ipClauses,
			RequireAddendum: requireAddendum,
		}
		return db.Create(&config).Error
	}

	// Update existing
	config.CustomTerms = customTerms
	config.IPClauses = ipClauses
	config.RequireAddendum = requireAddendum
	return db.Save(&config).Error
}

// GetInvestorNDAs returns all NDAs signed by an investor
func (s *NDAService) GetInvestorNDAs(investorID uuid.UUID) ([]models.NDA, error) {
	db := database.GetDB()

	var ndas []models.NDA
	err := db.Where("investor_id = ?", investorID).
		Order("signed_at DESC").
		Find(&ndas).Error

	return ndas, err
}

// GetProjectNDASignatures returns all signatures for a project
func (s *NDAService) GetProjectNDASignatures(projectID uuid.UUID) ([]models.ProjectNDASignature, error) {
	db := database.GetDB()

	var signatures []models.ProjectNDASignature
	err := db.Where("project_id = ?", projectID).
		Preload("Investor").
		Order("signed_at DESC").
		Find(&signatures).Error

	return signatures, err
}
