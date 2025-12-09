package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/ukuvago/angelvault/internal/config"
	"github.com/ukuvago/angelvault/internal/handlers"
	"github.com/ukuvago/angelvault/internal/middleware"
	"github.com/ukuvago/angelvault/internal/models"
	"github.com/ukuvago/angelvault/internal/services"
)

type Router struct {
	config *config.Config
	engine *gin.Engine

	// Services
	authService      *services.AuthService
	oauthService     *services.OAuthService
	paymentService   *services.PaymentService
	ndaService       *services.NDAService
	projectService   *services.ProjectService
	adminService     *services.AdminService
	auditService     *services.AuditService
	meetingService   *services.MeetingService
	readinessService *services.ReadinessService

	// Handlers
	authHandler      *handlers.AuthHandler
	projectHandler   *handlers.ProjectHandler
	paymentHandler   *handlers.PaymentHandler
	ndaHandler       *handlers.NDAHandler
	publicHandler    *handlers.PublicHandler
	adminHandler     *handlers.AdminHandler
	auditHandler     *handlers.AuditHandler
	meetingHandler   *handlers.MeetingHandler
	readinessHandler *handlers.ReadinessHandler
}

func NewRouter(cfg *config.Config) *Router {
	// Set Gin mode
	if cfg.IsProduction() {
		gin.SetMode(gin.ReleaseMode)
	}

	engine := gin.New()

	// Initialize services
	authService := services.NewAuthService(cfg)
	oauthService := services.NewOAuthService(cfg)
	paymentService := services.NewPaymentService(cfg)
	ndaService := services.NewNDAService(cfg)
	projectService := services.NewProjectService(cfg, paymentService, ndaService)
	adminService := services.NewAdminService(cfg)
	auditService := services.NewAuditService(cfg)
	meetingService := services.NewMeetingService(cfg, ndaService)
	readinessService := services.NewReadinessService(cfg)

	// Initialize handlers
	authHandler := handlers.NewAuthHandler(authService, oauthService, cfg)
	projectHandler := handlers.NewProjectHandler(projectService)
	paymentHandler := handlers.NewPaymentHandler(paymentService)
	ndaHandler := handlers.NewNDAHandler(ndaService)
	publicHandler := handlers.NewPublicHandler()
	adminHandler := handlers.NewAdminHandler(adminService)
	auditHandler := handlers.NewAuditHandler(auditService)
	meetingHandler := handlers.NewMeetingHandler(meetingService)
	readinessHandler := handlers.NewReadinessHandler(readinessService)

	return &Router{
		config:           cfg,
		engine:           engine,
		authService:      authService,
		oauthService:     oauthService,
		paymentService:   paymentService,
		ndaService:       ndaService,
		projectService:   projectService,
		adminService:     adminService,
		auditService:     auditService,
		meetingService:   meetingService,
		readinessService: readinessService,
		authHandler:      authHandler,
		projectHandler:   projectHandler,
		paymentHandler:   paymentHandler,
		ndaHandler:       ndaHandler,
		publicHandler:    publicHandler,
		adminHandler:     adminHandler,
		auditHandler:     auditHandler,
		meetingHandler:   meetingHandler,
		readinessHandler: readinessHandler,
	}
}

func (r *Router) Setup() *gin.Engine {
	// Global middleware
	r.engine.Use(gin.Recovery())
	r.engine.Use(middleware.CORSMiddleware(r.config))
	r.engine.Use(middleware.RateLimitMiddleware(r.config))

	// Health checks (no rate limit)
	r.engine.GET("/health", r.publicHandler.HealthCheck)
	r.engine.GET("/health/live", r.publicHandler.LivenessCheck)
	r.engine.GET("/health/ready", r.publicHandler.ReadinessCheck)

	// API routes
	api := r.engine.Group("/api")
	{
		// Public routes
		r.setupPublicRoutes(api)

		// Auth routes
		r.setupAuthRoutes(api)

		// Protected routes
		r.setupProtectedRoutes(api)

		// Admin routes
		r.setupAdminRoutes(api)
	}

	// Serve static files for frontend
	r.engine.Static("/static", "./web/static")
	r.engine.StaticFile("/", "./web/index.html")
	r.engine.NoRoute(func(c *gin.Context) {
		c.File("./web/index.html")
	})

	return r.engine
}

func (r *Router) setupPublicRoutes(api *gin.RouterGroup) {
	public := api.Group("/public")
	{
		public.GET("/stats", r.publicHandler.GetPublicStats)
		public.GET("/categories", r.publicHandler.GetCategories)
		public.GET("/categories/:slug", r.publicHandler.GetCategory)
	}

	// Projects (public listing with optional auth for unlock status)
	projects := api.Group("/projects")
	projects.Use(middleware.OptionalAuthMiddleware(r.config))
	{
		projects.GET("", r.projectHandler.ListProjects)
		projects.GET("/:id", r.projectHandler.GetProject)
	}

	// Stripe config (public)
	api.GET("/config/stripe", r.paymentHandler.GetStripeConfig)

	// Stripe webhook (no auth, but verified by signature)
	api.POST("/webhooks/stripe", r.paymentHandler.HandleStripeWebhook)
}

func (r *Router) setupAuthRoutes(api *gin.RouterGroup) {
	auth := api.Group("/auth")
	auth.Use(middleware.StrictRateLimitMiddleware())
	{
		// Standard auth
		auth.POST("/register", r.authHandler.Register)
		auth.POST("/login", r.authHandler.Login)
		auth.POST("/password/reset-request", r.authHandler.RequestPasswordReset)
		auth.POST("/password/reset", r.authHandler.ResetPassword)
		auth.GET("/verify-email", r.authHandler.VerifyEmail)

		// OAuth providers
		auth.GET("/providers", r.authHandler.GetOAuthProviders)

		// Google OAuth
		auth.GET("/google", r.authHandler.GoogleAuthURL)
		auth.GET("/google/callback", r.authHandler.GoogleCallback)

		// LinkedIn OAuth
		auth.GET("/linkedin", r.authHandler.LinkedInAuthURL)
		auth.GET("/linkedin/callback", r.authHandler.LinkedInCallback)

		// Apple OAuth
		auth.GET("/apple", r.authHandler.AppleAuthURL)
		auth.POST("/apple/callback", r.authHandler.AppleCallback)
	}

	// Protected auth routes
	authProtected := api.Group("/auth")
	authProtected.Use(middleware.AuthMiddleware(r.config))
	{
		authProtected.GET("/me", r.authHandler.GetCurrentUser)
		authProtected.PUT("/profile", r.authHandler.UpdateProfile)
		authProtected.PUT("/password", r.authHandler.ChangePassword)
	}
}

func (r *Router) setupProtectedRoutes(api *gin.RouterGroup) {
	protected := api.Group("")
	protected.Use(middleware.AuthMiddleware(r.config))

	// Developer routes
	developer := protected.Group("/developer")
	developer.Use(middleware.RequireRole(models.RoleDeveloper, models.RoleAdmin))
	{
		// Dashboard
		developer.GET("/dashboard", r.auditHandler.GetDeveloperDashboard)
		
		developer.GET("/projects", r.projectHandler.GetDeveloperProjects)
		developer.POST("/projects", r.projectHandler.CreateProject)
		developer.PUT("/projects/:id", r.projectHandler.UpdateProject)
		developer.POST("/projects/:id/submit", r.projectHandler.SubmitProject)

		// Team members
		developer.POST("/projects/:id/team", r.projectHandler.AddTeamMember)
		developer.PUT("/projects/:id/team/:memberId", r.projectHandler.UpdateTeamMember)
		developer.DELETE("/projects/:id/team/:memberId", r.projectHandler.DeleteTeamMember)

		// NDA config for projects (changed :projectId to :id)
		developer.PUT("/projects/:id/nda-config", r.ndaHandler.UpdateProjectNDAConfig)
		developer.GET("/projects/:id/nda-signatures", r.ndaHandler.GetProjectNDASignatures)
		
		// Project readiness (business stage, legal entity, etc.)
		developer.GET("/projects/:id/readiness", r.readinessHandler.GetProjectReadiness)
		developer.PUT("/projects/:id/readiness", r.readinessHandler.UpdateProjectReadiness)
		
		// Meeting requests (from investors)
		developer.GET("/meetings", r.meetingHandler.GetDeveloperMeetingRequests)
		developer.GET("/meetings/:id", r.meetingHandler.GetMeetingRequest)
		developer.POST("/meetings/:id/respond", r.meetingHandler.RespondToMeetingRequest)
		developer.POST("/meetings/:id/complete", r.meetingHandler.CompleteMeeting)
		developer.GET("/meetings/:id/messages", r.meetingHandler.GetMessages)
		developer.POST("/meetings/:id/messages", r.meetingHandler.SendMessage)
	}

	// Investor routes
	investor := protected.Group("/investor")
	investor.Use(middleware.RequireRole(models.RoleInvestor, models.RoleAdmin))
	{
		// Dashboard
		investor.GET("/dashboard", r.auditHandler.GetInvestorDashboard)
		
		// Profile
		investor.GET("/profile", r.authHandler.GetInvestorProfile)
		investor.PUT("/profile", r.authHandler.UpdateInvestorProfile)
		
		// Payments
		investor.GET("/payments/status", r.paymentHandler.GetPaymentStatus)
		investor.POST("/payments/create-intent", r.paymentHandler.CreatePaymentIntent)
		investor.POST("/payments/confirm", r.paymentHandler.ConfirmPayment)
		investor.GET("/payments/history", r.paymentHandler.GetPaymentHistory)
		investor.GET("/payments/viewed", r.paymentHandler.GetViewedProjects)

		// NDA
		investor.GET("/nda/status", r.ndaHandler.GetMasterNDAStatus)
		investor.GET("/nda/content", r.ndaHandler.GetMasterNDAContent)
		investor.POST("/nda/sign", r.ndaHandler.SignMasterNDA)
		investor.GET("/nda/list", r.ndaHandler.GetInvestorNDAs)

		// Project NDA (changed :projectId to :id)
		investor.GET("/nda/project/:id/status", r.ndaHandler.GetProjectNDAStatus)
		investor.GET("/nda/project/:id/content", r.ndaHandler.GetProjectAddendumContent)
		investor.POST("/nda/project/:id/sign", r.ndaHandler.SignProjectAddendum)

		// Unlock project
		investor.POST("/projects/:id/unlock", r.projectHandler.UnlockProject)
		
		// Meeting requests
		investor.POST("/meetings", r.meetingHandler.CreateMeetingRequest)
		investor.GET("/meetings", r.meetingHandler.GetInvestorMeetingRequests)
		investor.GET("/meetings/:id", r.meetingHandler.GetMeetingRequest)
		investor.POST("/meetings/:id/cancel", r.meetingHandler.CancelMeetingRequest)
		investor.GET("/meetings/:id/messages", r.meetingHandler.GetMessages)
		investor.POST("/meetings/:id/messages", r.meetingHandler.SendMessage)
		investor.GET("/messages/unread", r.meetingHandler.GetUnreadCount)
	}
}

func (r *Router) setupAdminRoutes(api *gin.RouterGroup) {
	admin := api.Group("/admin")
	admin.Use(middleware.AuthMiddleware(r.config))
	admin.Use(middleware.RequireAdmin())
	{
		// Dashboard & Stats
		admin.GET("/stats", r.auditHandler.GetDashboardStats)
		admin.GET("/activity", r.auditHandler.GetRecentActivity)
		
		// Audit Trail
		admin.GET("/audit", r.auditHandler.GetAuditLogs)
		admin.GET("/audit/user/:id", r.auditHandler.GetUserActivityHistory)
		admin.GET("/audit/investor/:id", r.auditHandler.GetInvestorAccessHistory)
		admin.GET("/audit/project/:id/views", r.auditHandler.GetProjectViewHistory)
		
		// Admin User management (only admins can manage admins)
		admin.GET("/admins", r.adminHandler.ListAdmins)
		admin.POST("/admins", r.adminHandler.CreateAdmin)
		admin.PUT("/admins/:id", r.adminHandler.UpdateAdmin)
		admin.DELETE("/admins/:id", r.adminHandler.DeleteAdmin)
		admin.POST("/admins/:id/reset-password", r.adminHandler.ResetAdminPassword)
		
		// User management
		admin.GET("/users", r.adminHandler.ListUsers)
		admin.GET("/users/:id", r.adminHandler.GetUser)
		admin.PUT("/users/:id", r.adminHandler.UpdateUser)
		admin.POST("/users/developer", r.adminHandler.CreateDeveloper)
		
		// Project management
		admin.GET("/projects", r.adminHandler.ListAllProjects)
		admin.GET("/projects/pending", r.adminHandler.GetPendingProjects)
		admin.POST("/projects", r.adminHandler.CreateProject)
		admin.PUT("/projects/:id", r.adminHandler.UpdateProject)
		admin.POST("/projects/:id/approve", r.adminHandler.ApproveProject)
		admin.POST("/projects/:id/reject", r.adminHandler.RejectProject)
		admin.DELETE("/projects/:id", r.adminHandler.DeleteProject)
		
		// Project images
		admin.GET("/projects/:id/images", r.adminHandler.GetProjectImages)
		admin.POST("/projects/:id/images", r.adminHandler.AddProjectImage)
		admin.PUT("/projects/:id/images/:imageId", r.adminHandler.UpdateProjectImage)
		admin.DELETE("/projects/:id/images/:imageId", r.adminHandler.DeleteProjectImage)
		
		// Category management
		admin.GET("/categories", r.adminHandler.ListCategories)
		admin.POST("/categories", r.adminHandler.CreateCategory)
		admin.PUT("/categories/:id", r.adminHandler.UpdateCategory)
		admin.DELETE("/categories/:id", r.adminHandler.DeleteCategory)
		
		// Project readiness verification
		admin.GET("/projects/:id/readiness", r.readinessHandler.GetProjectReadiness)
		admin.POST("/projects/:id/readiness/verify", r.readinessHandler.VerifyProjectReadiness)
	}
}

func (r *Router) Engine() *gin.Engine {
	return r.engine
}
