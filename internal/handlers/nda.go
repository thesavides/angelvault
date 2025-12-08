package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/ukuvago/angelvault/internal/middleware"
	"github.com/ukuvago/angelvault/internal/services"
)

type NDAHandler struct {
	ndaService *services.NDAService
}

func NewNDAHandler(ndaSvc *services.NDAService) *NDAHandler {
	return &NDAHandler{ndaService: ndaSvc}
}

// GetMasterNDAStatus returns the investor's master NDA status
func (h *NDAHandler) GetMasterNDAStatus(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	status := h.ndaService.GetMasterNDAStatus(userID)
	c.JSON(http.StatusOK, status)
}

// GetMasterNDAContent returns the NDA content for review/signing
func (h *NDAHandler) GetMasterNDAContent(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	content, err := h.ndaService.GetMasterNDAContent(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"content": content})
}

// SignMasterNDA signs the master platform NDA
func (h *NDAHandler) SignMasterNDA(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var req services.SignNDARequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	nda, err := h.ndaService.SignMasterNDA(userID, &req, c.ClientIP(), c.GetHeader("User-Agent"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":    "NDA signed successfully",
		"signed_at":  nda.SignedAt,
		"expires_at": nda.ExpiresAt,
	})
}

// GetProjectNDAStatus returns the NDA status for a specific project
func (h *NDAHandler) GetProjectNDAStatus(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	projectID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	status := h.ndaService.GetProjectNDAStatus(userID, projectID)
	c.JSON(http.StatusOK, status)
}

// GetProjectAddendumContent returns the addendum content for review/signing
func (h *NDAHandler) GetProjectAddendumContent(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	projectID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	content, err := h.ndaService.GetProjectAddendumContent(userID, projectID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"content": content})
}

// SignProjectAddendum signs the project-specific NDA addendum
func (h *NDAHandler) SignProjectAddendum(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	projectID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	var req services.SignNDARequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	signature, err := h.ndaService.SignProjectAddendum(
		userID,
		projectID,
		&req,
		c.ClientIP(),
		c.GetHeader("User-Agent"),
	)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":   "Project NDA addendum signed successfully",
		"signed_at": signature.SignedAt,
	})
}

// GetInvestorNDAs returns all NDAs signed by the investor
func (h *NDAHandler) GetInvestorNDAs(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	ndas, err := h.ndaService.GetInvestorNDAs(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch NDAs"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ndas": ndas})
}

// UpdateProjectNDAConfig updates the NDA config for a developer's project
func (h *NDAHandler) UpdateProjectNDAConfig(c *gin.Context) {
	projectID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	// TODO: Verify project ownership

	var req struct {
		CustomTerms     string `json:"custom_terms"`
		IPClauses       string `json:"ip_clauses"`
		RequireAddendum bool   `json:"require_addendum"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.ndaService.UpdateProjectNDAConfig(projectID, req.CustomTerms, req.IPClauses, req.RequireAddendum); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "NDA config updated"})
}

// GetProjectNDASignatures returns all signatures for a project (for developers)
func (h *NDAHandler) GetProjectNDASignatures(c *gin.Context) {
	projectID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	// TODO: Verify project ownership

	signatures, err := h.ndaService.GetProjectNDASignatures(projectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch signatures"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"signatures": signatures})
}
