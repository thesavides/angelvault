package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/ukuvago/angelvault/internal/models"
	"github.com/ukuvago/angelvault/internal/services"
)

type AdminHandler struct {
	adminService *services.AdminService
}

func NewAdminHandler(adminSvc *services.AdminService) *AdminHandler {
	return &AdminHandler{adminService: adminSvc}
}

// ========================================
// DASHBOARD
// ========================================

// GetDashboardStats returns admin dashboard statistics
func (h *AdminHandler) GetDashboardStats(c *gin.Context) {
	stats, err := h.adminService.GetDashboardStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get dashboard stats"})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// ========================================
// USER MANAGEMENT
// ========================================

// ListUsers returns paginated list of users
func (h *AdminHandler) ListUsers(c *gin.Context) {
	page := 1
	pageSize := 20

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

	role := c.Query("role")
	search := c.Query("search")

	users, total, err := h.adminService.ListUsers(page, pageSize, role, search)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch users"})
		return
	}

	// Convert to response format (exclude sensitive data)
	var response []gin.H
	for _, u := range users {
		response = append(response, gin.H{
			"id":            u.ID,
			"email":         u.Email,
			"first_name":    u.FirstName,
			"last_name":     u.LastName,
			"company_name":  u.CompanyName,
			"role":          u.Role,
			"auth_provider": u.AuthProvider,
			"email_verified": u.EmailVerified,
			"is_active":     u.IsActive,
			"last_login_at": u.LastLoginAt,
			"created_at":    u.CreatedAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"users":     response,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

// GetUser returns a single user
func (h *AdminHandler) GetUser(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	user, err := h.adminService.GetUser(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"user": user.ToResponse()})
}

// UpdateUser updates a user
func (h *AdminHandler) UpdateUser(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var req struct {
		FirstName   string          `json:"first_name" binding:"required"`
		LastName    string          `json:"last_name" binding:"required"`
		CompanyName string          `json:"company_name"`
		Role        models.UserRole `json:"role" binding:"required"`
		IsActive    bool            `json:"is_active"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.adminService.UpdateUser(userID, req.FirstName, req.LastName, req.CompanyName, req.Role, req.IsActive)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "User updated successfully",
		"user":    user.ToResponse(),
	})
}

// CreateDeveloper creates a new developer account
func (h *AdminHandler) CreateDeveloper(c *gin.Context) {
	var req struct {
		Email       string `json:"email" binding:"required,email"`
		FirstName   string `json:"first_name" binding:"required"`
		LastName    string `json:"last_name" binding:"required"`
		CompanyName string `json:"company_name"`
		Password    string `json:"password"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user, err := h.adminService.CreateDeveloperUser(req.Email, req.FirstName, req.LastName, req.CompanyName, req.Password)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Developer created successfully",
		"user":    user.ToResponse(),
	})
}

// ========================================
// PROJECT MANAGEMENT
// ========================================

// ListAllProjects returns all projects for admin
func (h *AdminHandler) ListAllProjects(c *gin.Context) {
	page := 1
	pageSize := 20

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

	status := c.Query("status")
	search := c.Query("search")

	projects, total, err := h.adminService.ListAllProjects(page, pageSize, status, search)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch projects"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"projects":  projects,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

// GetPendingProjects returns projects awaiting approval
func (h *AdminHandler) GetPendingProjects(c *gin.Context) {
	projects, err := h.adminService.GetPendingProjects()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch pending projects"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"projects": projects})
}

// CreateProject creates a project on behalf of a developer
func (h *AdminHandler) CreateProject(c *gin.Context) {
	var req services.AdminCreateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	project, err := h.adminService.CreateProjectForDeveloper(&req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Project created successfully",
		"project": project,
	})
}

// UpdateProject updates any project
func (h *AdminHandler) UpdateProject(c *gin.Context) {
	projectID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	var req services.AdminCreateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	project, err := h.adminService.UpdateProject(projectID, &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Project updated successfully",
		"project": project,
	})
}

// ApproveProject approves a pending project
func (h *AdminHandler) ApproveProject(c *gin.Context) {
	projectID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	project, err := h.adminService.ApproveProject(projectID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Project approved successfully",
		"project": project,
	})
}

// RejectProject rejects a project
func (h *AdminHandler) RejectProject(c *gin.Context) {
	projectID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	var req struct {
		Reason string `json:"reason" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	project, err := h.adminService.RejectProject(projectID, req.Reason)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Project rejected",
		"project": project,
	})
}

// DeleteProject deletes a project
func (h *AdminHandler) DeleteProject(c *gin.Context) {
	projectID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	if err := h.adminService.DeleteProject(projectID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Project deleted"})
}

// ========================================
// PROJECT IMAGES
// ========================================

// GetProjectImages returns all images for a project
func (h *AdminHandler) GetProjectImages(c *gin.Context) {
	projectID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	images, err := h.adminService.GetProjectImages(projectID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch images"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"images": images})
}

// AddProjectImage adds an image to a project
func (h *AdminHandler) AddProjectImage(c *gin.Context) {
	projectID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid project ID"})
		return
	}

	var req services.ProjectImageInput
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	image, err := h.adminService.AddProjectImage(projectID, &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Image added successfully",
		"image":   image,
	})
}

// UpdateProjectImage updates a project image
func (h *AdminHandler) UpdateProjectImage(c *gin.Context) {
	imageID, err := uuid.Parse(c.Param("imageId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid image ID"})
		return
	}

	var req services.ProjectImageInput
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	image, err := h.adminService.UpdateProjectImage(imageID, &req)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Image updated successfully",
		"image":   image,
	})
}

// DeleteProjectImage deletes a project image
func (h *AdminHandler) DeleteProjectImage(c *gin.Context) {
	imageID, err := uuid.Parse(c.Param("imageId"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid image ID"})
		return
	}

	if err := h.adminService.DeleteProjectImage(imageID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Image deleted"})
}

// ========================================
// CATEGORY MANAGEMENT
// ========================================

// ListCategories returns all categories (including inactive)
func (h *AdminHandler) ListCategories(c *gin.Context) {
	categories, err := h.adminService.ListCategories()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch categories"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"categories": categories})
}

// CreateCategory creates a new category
func (h *AdminHandler) CreateCategory(c *gin.Context) {
	var req struct {
		Name         string `json:"name" binding:"required"`
		Description  string `json:"description"`
		Icon         string `json:"icon"`
		IconURL      string `json:"icon_url"`
		Color        string `json:"color"`
		DisplayOrder int    `json:"display_order"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	category, err := h.adminService.CreateCategory(
		req.Name,
		req.Description,
		req.Icon,
		req.IconURL,
		req.Color,
		req.DisplayOrder,
	)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":  "Category created successfully",
		"category": category,
	})
}

// UpdateCategory updates a category
func (h *AdminHandler) UpdateCategory(c *gin.Context) {
	categoryID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid category ID"})
		return
	}

	var req struct {
		Name         string `json:"name" binding:"required"`
		Description  string `json:"description"`
		Icon         string `json:"icon"`
		IconURL      string `json:"icon_url"`
		Color        string `json:"color"`
		DisplayOrder int    `json:"display_order"`
		IsActive     bool   `json:"is_active"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	category, err := h.adminService.UpdateCategory(
		categoryID,
		req.Name,
		req.Description,
		req.Icon,
		req.IconURL,
		req.Color,
		req.DisplayOrder,
		req.IsActive,
	)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":  "Category updated successfully",
		"category": category,
	})
}

// DeleteCategory deletes a category
func (h *AdminHandler) DeleteCategory(c *gin.Context) {
	categoryID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid category ID"})
		return
	}

	if err := h.adminService.DeleteCategory(categoryID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Category deleted"})
}

// ========================================
// ADMIN USER MANAGEMENT
// ========================================

// ListAdmins returns all admin users
func (h *AdminHandler) ListAdmins(c *gin.Context) {
	admins, err := h.adminService.ListAdminUsers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch admins"})
		return
	}

	// Convert to safe response format
	var response []gin.H
	for _, a := range admins {
		response = append(response, gin.H{
			"id":            a.ID,
			"email":         a.Email,
			"first_name":    a.FirstName,
			"last_name":     a.LastName,
			"is_active":     a.IsActive,
			"last_login_at": a.LastLoginAt,
			"created_at":    a.CreatedAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{"admins": response})
}

// CreateAdmin creates a new admin user
func (h *AdminHandler) CreateAdmin(c *gin.Context) {
	var req struct {
		Email     string `json:"email" binding:"required,email"`
		FirstName string `json:"first_name" binding:"required"`
		LastName  string `json:"last_name" binding:"required"`
		Password  string `json:"password" binding:"required,min=12"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	admin, err := h.adminService.CreateAdminUser(req.Email, req.FirstName, req.LastName, req.Password)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Admin created successfully",
		"admin": gin.H{
			"id":         admin.ID,
			"email":      admin.Email,
			"first_name": admin.FirstName,
			"last_name":  admin.LastName,
			"created_at": admin.CreatedAt,
		},
	})
}

// UpdateAdmin updates an admin user
func (h *AdminHandler) UpdateAdmin(c *gin.Context) {
	adminID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid admin ID"})
		return
	}

	var req struct {
		FirstName string `json:"first_name" binding:"required"`
		LastName  string `json:"last_name" binding:"required"`
		IsActive  bool   `json:"is_active"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	admin, err := h.adminService.UpdateAdminUser(adminID, req.FirstName, req.LastName, req.IsActive)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Admin updated successfully",
		"admin":   admin.ToResponse(),
	})
}

// DeleteAdmin deactivates an admin user
func (h *AdminHandler) DeleteAdmin(c *gin.Context) {
	adminID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid admin ID"})
		return
	}

	if err := h.adminService.DeleteAdminUser(adminID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Admin deactivated"})
}

// ResetAdminPassword resets another admin's password
func (h *AdminHandler) ResetAdminPassword(c *gin.Context) {
	adminID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid admin ID"})
		return
	}

	var req struct {
		NewPassword string `json:"new_password" binding:"required,min=12"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.adminService.ResetAdminPassword(adminID, req.NewPassword); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Password reset successfully"})
}
