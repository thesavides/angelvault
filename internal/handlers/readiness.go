package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/ukuvago/angelvault/internal/middleware"
	"github.com/ukuvago/angelvault/internal/models"
	"github.com/ukuvago/angelvault/internal/services"
)

type ReadinessHandler struct {
	readinessService *services.ReadinessService
}

func NewReadinessHandler(readinessSvc *services.ReadinessService) *ReadinessHandler {
	return &ReadinessHandler{readinessService: readinessSvc}
}

// GetProjectReadiness returns readiness data for a project
func (h *ReadinessHandler) GetProjectReadiness(c *gin.Context) {
	projectID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	readiness, err := h.readinessService.GetProjectReadiness(projectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get readiness data"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"readiness":       readiness,
		"readiness_score": readiness.ReadinessScore(),
		"readiness_level": readiness.ReadinessLevel(),
		"missing_items":   readiness.MissingRequirements(),
	})
}

// UpdateProjectReadiness updates readiness data for a project
func (h *ReadinessHandler) UpdateProjectReadiness(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	projectID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	var req struct {
		Stage                      models.BusinessStage `json:"stage"`
		HasLegalEntity             bool                 `json:"has_legal_entity"`
		LegalEntityType            string               `json:"legal_entity_type"`
		LegalEntityName            string               `json:"legal_entity_name"`
		LegalJurisdiction          string               `json:"legal_jurisdiction"`
		IncorporationDate          *time.Time           `json:"incorporation_date"`
		RegistrationNumber         string               `json:"registration_number"`
		HasWorkingPOC              bool                 `json:"has_working_poc"`
		POCDescription             string               `json:"poc_description"`
		POCLink                    string               `json:"poc_link"`
		HasMVP                     bool                 `json:"has_mvp"`
		MVPLaunchDate              *time.Time           `json:"mvp_launch_date"`
		HasPayingCustomers         bool                 `json:"has_paying_customers"`
		CustomerCount              int                  `json:"customer_count"`
		HasBankAccount             bool                 `json:"has_bank_account"`
		BankName                   string               `json:"bank_name"`
		BankCountry                string               `json:"bank_country"`
		HasFinancialModel          bool                 `json:"has_financial_model"`
		FinancialModelURL          string               `json:"financial_model_url"`
		HasRevenueProjections      bool                 `json:"has_revenue_projections"`
		HasShareholdersAgreement   bool                 `json:"has_shareholders_agreement"`
		ShareholdersAgreementDate  *time.Time           `json:"shareholders_agreement_date"`
		HasFoundersAgreement       bool                 `json:"has_founders_agreement"`
		HasIPAssignment            bool                 `json:"has_ip_assignment"`
		HasEmployeeContracts       bool                 `json:"has_employee_contracts"`
		HasCapTable                bool                 `json:"has_cap_table"`
		CapTableDocument           string               `json:"cap_table_document"`
		TotalSharesAuthorized      int64                `json:"total_shares_authorized"`
		FounderOwnership           float64              `json:"founder_ownership"`
		HasPreviousFunding         bool                 `json:"has_previous_funding"`
		PreviousFundingAmount      int64                `json:"previous_funding_amount"`
		PreviousFundingType        string               `json:"previous_funding_type"`
		PreviousFundingDate        *time.Time           `json:"previous_funding_date"`
		FullTimeFounders           int                  `json:"full_time_founders"`
		FullTimeEmployees          int                  `json:"full_time_employees"`
		PartTimeContractors        int                  `json:"part_time_contractors"`
		HasAdvisors                bool                 `json:"has_advisors"`
		AdvisorCount               int                  `json:"advisor_count"`
		HasPrivacyPolicy           bool                 `json:"has_privacy_policy"`
		HasTermsOfService          bool                 `json:"has_terms_of_service"`
		IsGDPRCompliant            bool                 `json:"is_gdpr_compliant"`
		HasDataProcessingAgreement bool                 `json:"has_data_processing_agreement"`
		Notes                      string               `json:"notes"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	input := &models.ProjectReadiness{
		Stage:                      req.Stage,
		HasLegalEntity:             req.HasLegalEntity,
		LegalEntityType:            req.LegalEntityType,
		LegalEntityName:            req.LegalEntityName,
		LegalJurisdiction:          req.LegalJurisdiction,
		IncorporationDate:          req.IncorporationDate,
		RegistrationNumber:         req.RegistrationNumber,
		HasWorkingPOC:              req.HasWorkingPOC,
		POCDescription:             req.POCDescription,
		POCLink:                    req.POCLink,
		HasMVP:                     req.HasMVP,
		MVPLaunchDate:              req.MVPLaunchDate,
		HasPayingCustomers:         req.HasPayingCustomers,
		CustomerCount:              req.CustomerCount,
		HasBankAccount:             req.HasBankAccount,
		BankName:                   req.BankName,
		BankCountry:                req.BankCountry,
		HasFinancialModel:          req.HasFinancialModel,
		FinancialModelURL:          req.FinancialModelURL,
		HasRevenueProjections:      req.HasRevenueProjections,
		HasShareholdersAgreement:   req.HasShareholdersAgreement,
		ShareholdersAgreementDate:  req.ShareholdersAgreementDate,
		HasFoundersAgreement:       req.HasFoundersAgreement,
		HasIPAssignment:            req.HasIPAssignment,
		HasEmployeeContracts:       req.HasEmployeeContracts,
		HasCapTable:                req.HasCapTable,
		CapTableDocument:           req.CapTableDocument,
		TotalSharesAuthorized:      req.TotalSharesAuthorized,
		FounderOwnership:           req.FounderOwnership,
		HasPreviousFunding:         req.HasPreviousFunding,
		PreviousFundingAmount:      req.PreviousFundingAmount,
		PreviousFundingType:        req.PreviousFundingType,
		PreviousFundingDate:        req.PreviousFundingDate,
		FullTimeFounders:           req.FullTimeFounders,
		FullTimeEmployees:          req.FullTimeEmployees,
		PartTimeContractors:        req.PartTimeContractors,
		HasAdvisors:                req.HasAdvisors,
		AdvisorCount:               req.AdvisorCount,
		HasPrivacyPolicy:           req.HasPrivacyPolicy,
		HasTermsOfService:          req.HasTermsOfService,
		IsGDPRCompliant:            req.IsGDPRCompliant,
		HasDataProcessingAgreement: req.HasDataProcessingAgreement,
		Notes:                      req.Notes,
	}

	readiness, err := h.readinessService.UpdateProjectReadiness(userID, projectID, input)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":         "Readiness data updated",
		"readiness":       readiness,
		"readiness_score": readiness.ReadinessScore(),
		"readiness_level": readiness.ReadinessLevel(),
		"missing_items":   readiness.MissingRequirements(),
	})
}

// VerifyProjectReadiness allows admin to verify readiness data
func (h *ReadinessHandler) VerifyProjectReadiness(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	projectID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	readiness, err := h.readinessService.VerifyProjectReadiness(userID, projectID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":   "Readiness data verified",
		"readiness": readiness,
	})
}
