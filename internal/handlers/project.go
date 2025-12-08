package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/ukuvago/angelvault/internal/middleware"
	"github.com/ukuvago/angelvault/internal/models"
	"github.com/ukuvago/angelvault/internal/services"
)

type ProjectHandler struct {
	projectService *services.ProjectService
}

func NewProjectHandler(projectSvc *services.ProjectService) *ProjectHandler {
	return &ProjectHandler{projectService: projectSvc}
}

// ListProjects returns approved projects for browsing
func (h *ProjectHandler) ListProjects(c *gin.Context) {
	params := services.ListProjectsParams{
		Page:     1,
		PageSize: 20,
	}

	// Parse query parameters
	if page := c.Query("page"); page != "" {
		if p, err := strconv.Atoi(page); err == nil {
			params.Page = p
		}
	}

	if pageSize := c.Query("page_size"); pageSize != "" {
		if ps, err := strconv.Atoi(pageSize); err == nil {
			params.PageSize = ps
		}
	}

	if categoryID := c.Query("category"); categoryID != "" {
		if id, err := uuid.Parse(categoryID); err == nil {
			params.CategoryID = &id
		}
	}

	params.Search = c.Query("search")
	params.SortBy = c.Query("sort_by")
	params.SortOrder = c.Query("sort_order")

	if minAmount := c.Query("min_amount"); minAmount != "" {
		if amt, err := strconv.ParseInt(minAmount, 10, 64); err == nil {
			params.MinAmount = &amt
		}
	}

	if maxAmount := c.Query("max_amount"); maxAmount != "" {
		if amt, err := strconv.ParseInt(maxAmount, 10, 64); err == nil {
			params.MaxAmount = &amt
		}
	}

	// Check if user is authenticated to show unlock status
	if userID, exists := middleware.GetUserID(c); exists {
		params.InvestorID = &userID
	}

	projects, total, err := h.projectService.ListPublicProjects(params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch projects"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"projects": projects,
		"total":    total,
		"page":     params.Page,
		"pageSize": params.PageSize,
	})
}

// GetProject returns a single project
func (h *ProjectHandler) GetProject(c *gin.Context) {
	projectID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	var investorID *uuid.UUID
	if userID, exists := middleware.GetUserID(c); exists {
		investorID = &userID
	}

	project, isUnlocked, err := h.projectService.GetProject(projectID, investorID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	// If not unlocked, return limited view
	if !isUnlocked && investorID != nil {
		categoryName := ""
		if project.Category != nil {
			categoryName = project.Category.Name
		}
		c.JSON(http.StatusOK, gin.H{
			"project":    project.ToPublicView(categoryName, false),
			"is_unlocked": false,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"project":    project,
		"is_unlocked": isUnlocked,
	})
}

// CreateProject creates a new project
func (h *ProjectHandler) CreateProject(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var req services.CreateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	project, err := h.projectService.CreateProject(userID, &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Project created successfully",
		"project": project,
	})
}

// UpdateProject updates a project
func (h *ProjectHandler) UpdateProject(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	projectID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	var req services.CreateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	project, err := h.projectService.UpdateProject(projectID, userID, &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Project updated successfully",
		"project": project,
	})
}

// SubmitProject submits a project for review
func (h *ProjectHandler) SubmitProject(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	projectID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	project, err := h.projectService.SubmitProject(projectID, userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Project submitted for review",
		"project": project,
	})
}

// GetDeveloperProjects returns projects for the authenticated developer
func (h *ProjectHandler) GetDeveloperProjects(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	projects, err := h.projectService.GetDeveloperProjects(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch projects"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"projects": projects})
}

// UnlockProject unlocks a project for viewing
func (h *ProjectHandler) UnlockProject(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	projectID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	if err := h.projectService.UnlockProject(userID, projectID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Project unlocked successfully"})
}

// Team Member Handlers

// AddTeamMember adds a team member to a project
func (h *ProjectHandler) AddTeamMember(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	projectID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	var member models.TeamMember
	if err := c.ShouldBindJSON(&member); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.projectService.AddTeamMember(projectID, userID, &member); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Team member added",
		"member":  member,
	})
}

// UpdateTeamMember updates a team member
func (h *ProjectHandler) UpdateTeamMember(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	memberID, err := uuid.Parse(c.Param("memberId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid member ID"})
		return
	}

	var updates models.TeamMember
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.projectService.UpdateTeamMember(memberID, userID, &updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Team member updated"})
}

// DeleteTeamMember removes a team member
func (h *ProjectHandler) DeleteTeamMember(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	memberID, err := uuid.Parse(c.Param("memberId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid member ID"})
		return
	}

	if err := h.projectService.DeleteTeamMember(memberID, userID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Team member removed"})
}
