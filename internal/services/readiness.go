package services

import (
	"errors"

	"github.com/google/uuid"
	"github.com/ukuvago/angelvault/internal/config"
	"github.com/ukuvago/angelvault/internal/database"
	"github.com/ukuvago/angelvault/internal/models"
)

type ReadinessService struct {
	config *config.Config
}

func NewReadinessService(cfg *config.Config) *ReadinessService {
	return &ReadinessService{config: cfg}
}

// GetProjectReadiness returns readiness data for a project
func (s *ReadinessService) GetProjectReadiness(projectID uuid.UUID) (*models.ProjectReadiness, error) {
	db := database.GetDB()

	var readiness models.ProjectReadiness
	err := db.Where("project_id = ?", projectID).First(&readiness).Error
	if err != nil {
		// Return empty readiness if not found
		return &models.ProjectReadiness{ProjectID: projectID}, nil
	}

	return &readiness, nil
}

// UpdateProjectReadiness updates or creates readiness data for a project
func (s *ReadinessService) UpdateProjectReadiness(developerID uuid.UUID, projectID uuid.UUID, input *models.ProjectReadiness) (*models.ProjectReadiness, error) {
	db := database.GetDB()

	// Verify developer owns the project
	var project models.Project
	if err := db.First(&project, "id = ? AND developer_id = ?", projectID, developerID).Error; err != nil {
		return nil, errors.New("project not found or not authorized")
	}

	// Get or create readiness
	var readiness models.ProjectReadiness
	err := db.Where("project_id = ?", projectID).First(&readiness).Error
	
	if err != nil {
		// Create new
		input.ProjectID = projectID
		if err := db.Create(input).Error; err != nil {
			return nil, err
		}
		return input, nil
	}

	// Update existing
	readiness.Stage = input.Stage
	readiness.HasLegalEntity = input.HasLegalEntity
	readiness.LegalEntityType = input.LegalEntityType
	readiness.LegalEntityName = input.LegalEntityName
	readiness.LegalJurisdiction = input.LegalJurisdiction
	readiness.IncorporationDate = input.IncorporationDate
	readiness.RegistrationNumber = input.RegistrationNumber
	readiness.HasWorkingPOC = input.HasWorkingPOC
	readiness.POCDescription = input.POCDescription
	readiness.POCLink = input.POCLink
	readiness.HasMVP = input.HasMVP
	readiness.MVPLaunchDate = input.MVPLaunchDate
	readiness.HasPayingCustomers = input.HasPayingCustomers
	readiness.CustomerCount = input.CustomerCount
	readiness.HasBankAccount = input.HasBankAccount
	readiness.BankName = input.BankName
	readiness.BankCountry = input.BankCountry
	readiness.HasFinancialModel = input.HasFinancialModel
	readiness.FinancialModelURL = input.FinancialModelURL
	readiness.HasRevenueProjections = input.HasRevenueProjections
	readiness.HasShareholdersAgreement = input.HasShareholdersAgreement
	readiness.ShareholdersAgreementDate = input.ShareholdersAgreementDate
	readiness.HasFoundersAgreement = input.HasFoundersAgreement
	readiness.HasIPAssignment = input.HasIPAssignment
	readiness.HasEmployeeContracts = input.HasEmployeeContracts
	readiness.HasCapTable = input.HasCapTable
	readiness.CapTableDocument = input.CapTableDocument
	readiness.TotalSharesAuthorized = input.TotalSharesAuthorized
	readiness.FounderOwnership = input.FounderOwnership
	readiness.HasPreviousFunding = input.HasPreviousFunding
	readiness.PreviousFundingAmount = input.PreviousFundingAmount
	readiness.PreviousFundingType = input.PreviousFundingType
	readiness.PreviousFundingDate = input.PreviousFundingDate
	readiness.FullTimeFounders = input.FullTimeFounders
	readiness.FullTimeEmployees = input.FullTimeEmployees
	readiness.PartTimeContractors = input.PartTimeContractors
	readiness.HasAdvisors = input.HasAdvisors
	readiness.AdvisorCount = input.AdvisorCount
	readiness.HasPrivacyPolicy = input.HasPrivacyPolicy
	readiness.HasTermsOfService = input.HasTermsOfService
	readiness.IsGDPRCompliant = input.IsGDPRCompliant
	readiness.HasDataProcessingAgreement = input.HasDataProcessingAgreement
	readiness.Notes = input.Notes

	if err := db.Save(&readiness).Error; err != nil {
		return nil, err
	}

	return &readiness, nil
}

// VerifyProjectReadiness allows admin to verify readiness data
func (s *ReadinessService) VerifyProjectReadiness(adminID, projectID uuid.UUID) (*models.ProjectReadiness, error) {
	db := database.GetDB()

	var readiness models.ProjectReadiness
	if err := db.Where("project_id = ?", projectID).First(&readiness).Error; err != nil {
		return nil, errors.New("project readiness not found")
	}

	readiness.VerifiedByAdmin = true
	now := db.NowFunc()
	readiness.VerifiedAt = &now
	readiness.VerifiedByID = &adminID

	if err := db.Save(&readiness).Error; err != nil {
		return nil, err
	}

	return &readiness, nil
}
