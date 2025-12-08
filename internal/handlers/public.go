package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/ukuvago/angelvault/internal/database"
	"github.com/ukuvago/angelvault/internal/models"
)

type PublicHandler struct{}

func NewPublicHandler() *PublicHandler {
	return &PublicHandler{}
}

// GetPublicStats returns public platform statistics
func (h *PublicHandler) GetPublicStats(c *gin.Context) {
	db := database.GetDB()

	// Get category counts (approved projects only)
	var categories []models.CategoryWithCount
	db.Model(&models.Category{}).
		Select("categories.id, categories.name, categories.slug, categories.description, categories.icon, categories.icon_url, categories.color, COUNT(projects.id) as project_count").
		Joins("LEFT JOIN projects ON projects.category_id = categories.id AND projects.status = 'approved' AND projects.deleted_at IS NULL").
		Where("categories.is_active = ? AND categories.deleted_at IS NULL", true).
		Group("categories.id").
		Order("categories.display_order ASC, categories.name ASC").
		Scan(&categories)

	// Total approved projects
	var totalProjects int64
	db.Model(&models.Project{}).Where("status = ?", models.ProjectStatusApproved).Count(&totalProjects)

	// Total investors
	var totalInvestors int64
	db.Model(&models.User{}).Where("role = ?", models.RoleInvestor).Count(&totalInvestors)

	// Total funded (projects with status = funded)
	var totalFunded int64
	db.Model(&models.Project{}).Where("status = ?", models.ProjectStatusFunded).Count(&totalFunded)

	c.JSON(http.StatusOK, gin.H{
		"total_projects":  totalProjects,
		"total_investors": totalInvestors,
		"total_funded":    totalFunded,
		"categories":      categories,
	})
}

// GetCategories returns all active categories
func (h *PublicHandler) GetCategories(c *gin.Context) {
	db := database.GetDB()

	var categories []models.Category
	db.Where("is_active = ?", true).
		Order("display_order ASC, name ASC").
		Find(&categories)

	c.JSON(http.StatusOK, categories)
}

// GetCategory returns a single category with project count
func (h *PublicHandler) GetCategory(c *gin.Context) {
	db := database.GetDB()

	slug := c.Param("slug")

	var category models.Category
	if err := db.Where("slug = ? AND is_active = ?", slug, true).First(&category).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Category not found"})
		return
	}

	// Get project count
	var projectCount int64
	db.Model(&models.Project{}).
		Where("category_id = ? AND status = ?", category.ID, models.ProjectStatusApproved).
		Count(&projectCount)

	category.ProjectCount = int(projectCount)

	c.JSON(http.StatusOK, category)
}

// HealthCheck returns service health status
func (h *PublicHandler) HealthCheck(c *gin.Context) {
	if err := database.HealthCheck(); err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"status":   "unhealthy",
			"database": "disconnected",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":   "healthy",
		"database": "connected",
	})
}

// ReadinessCheck returns service readiness status
func (h *PublicHandler) ReadinessCheck(c *gin.Context) {
	if err := database.HealthCheck(); err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"ready":  false,
			"reason": "database not ready",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ready": true})
}

// LivenessCheck returns service liveness status
func (h *PublicHandler) LivenessCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"alive": true})
}
