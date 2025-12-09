package handlers

import (
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/ukuvago/angelvault/internal/middleware"
	"github.com/ukuvago/angelvault/internal/services"
)

type AuditHandler struct {
	auditService *services.AuditService
}

func NewAuditHandler(auditSvc *services.AuditService) *AuditHandler {
	return &AuditHandler{auditService: auditSvc}
}

// ========================================
// ADMIN AUDIT ENDPOINTS
// ========================================

// GetDashboardStats returns comprehensive dashboard statistics
func (h *AuditHandler) GetDashboardStats(c *gin.Context) {
	stats, err := h.auditService.GetDashboardStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get dashboard stats"})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// GetRecentActivity returns recent platform activity
func (h *AuditHandler) GetRecentActivity(c *gin.Context) {
	limit := 20
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil {
			limit = parsed
		}
	}

	activities, err := h.auditService.GetRecentActivity(limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get recent activity"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"activities": activities})
}

// GetAuditLogs returns filtered audit logs
func (h *AuditHandler) GetAuditLogs(c *gin.Context) {
	page := 1
	pageSize := 50

	if p := c.Query("page"); p != "" {
		if parsed, err := strconv.Atoi(p); err == nil {
			page = parsed
		}
	}

	if ps := c.Query("page_size"); ps != "" {
		if parsed, err := strconv.Atoi(ps); err == nil {
			pageSize = parsed
		}
	}

	var userID *uuid.UUID
	if uid := c.Query("user_id"); uid != "" {
		if parsed, err := uuid.Parse(uid); err == nil {
			userID = &parsed
		}
	}

	action := c.Query("action")
	entityType := c.Query("entity_type")

	var startDate, endDate *time.Time
	if sd := c.Query("start_date"); sd != "" {
		if parsed, err := time.Parse("2006-01-02", sd); err == nil {
			startDate = &parsed
		}
	}
	if ed := c.Query("end_date"); ed != "" {
		if parsed, err := time.Parse("2006-01-02", ed); err == nil {
			endOfDay := parsed.Add(24*time.Hour - time.Second)
			endDate = &endOfDay
		}
	}

	logs, total, err := h.auditService.GetAuditLogs(page, pageSize, userID, action, entityType, startDate, endDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get audit logs"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"logs":      logs,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

// GetProjectViewHistory returns view history for a specific project
func (h *AuditHandler) GetProjectViewHistory(c *gin.Context) {
	projectID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	views, err := h.auditService.GetProjectViewHistory(projectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get view history"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"views": views})
}

// GetUserActivityHistory returns activity history for a specific user
func (h *AuditHandler) GetUserActivityHistory(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	page := 1
	pageSize := 50

	if p := c.Query("page"); p != "" {
		if parsed, err := strconv.Atoi(p); err == nil {
			page = parsed
		}
	}

	logs, total, err := h.auditService.GetAuditLogs(page, pageSize, &userID, "", "", nil, nil)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user activity"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"logs":      logs,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

// GetInvestorAccessHistory returns access history for an investor
func (h *AuditHandler) GetInvestorAccessHistory(c *gin.Context) {
	investorID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid investor ID"})
		return
	}

	limit := 20
	if l := c.Query("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil {
			limit = parsed
		}
	}

	accessLogs, err := h.auditService.GetInvestorAccessHistory(investorID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get access history"})
		return
	}

	viewLogs, err := h.auditService.GetInvestorViewHistory(investorID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get view history"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"access_logs": accessLogs,
		"view_logs":   viewLogs,
	})
}

// ========================================
// INVESTOR DASHBOARD ENDPOINTS
// ========================================

// GetInvestorDashboard returns dashboard stats for the authenticated investor
func (h *AuditHandler) GetInvestorDashboard(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	stats, err := h.auditService.GetInvestorDashboardStats(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get dashboard stats"})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// GetInvestorViewedProjects returns projects the investor has viewed
func (h *AuditHandler) GetInvestorViewedProjects(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	views, err := h.auditService.GetInvestorViewHistory(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get viewed projects"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"views": views})
}

// ========================================
// DEVELOPER DASHBOARD ENDPOINTS
// ========================================

// GetDeveloperDashboard returns dashboard stats for the authenticated developer
func (h *AuditHandler) GetDeveloperDashboard(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	stats, err := h.auditService.GetDeveloperDashboardStats(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get dashboard stats"})
		return
	}

	c.JSON(http.StatusOK, stats)
}
