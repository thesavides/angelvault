package handlers

import (
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/ukuvago/angelvault/internal/middleware"
	"github.com/ukuvago/angelvault/internal/services"
)

type PaymentHandler struct {
	paymentService *services.PaymentService
}

func NewPaymentHandler(paymentSvc *services.PaymentService) *PaymentHandler {
	return &PaymentHandler{paymentService: paymentSvc}
}

// CreatePaymentIntent creates a new payment intent for viewing projects
func (h *PaymentHandler) CreatePaymentIntent(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	payment, clientSecret, err := h.paymentService.CreatePaymentIntent(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"payment_id":    payment.ID,
		"client_secret": clientSecret,
		"amount":        payment.Amount,
		"currency":      payment.Currency,
		"projects":      payment.ProjectsTotal,
		"is_demo":       !h.paymentService.IsStripeConfigured(),
	})
}

// ConfirmPayment confirms a completed payment
func (h *PaymentHandler) ConfirmPayment(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	var req struct {
		PaymentID       uuid.UUID `json:"payment_id" binding:"required"`
		StripePaymentID string    `json:"stripe_payment_id"`
		DemoMode        bool      `json:"demo_mode"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var payment interface{}
	var err error

	if req.DemoMode || !h.paymentService.IsStripeConfigured() {
		payment, err = h.paymentService.DemoConfirmPayment(req.PaymentID)
	} else {
		payment, err = h.paymentService.ConfirmPayment(req.PaymentID, req.StripePaymentID)
	}

	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	_ = userID // TODO: Validate payment belongs to user

	c.JSON(http.StatusOK, gin.H{
		"message": "Payment confirmed successfully",
		"payment": payment,
	})
}

// GetPaymentStatus returns the current payment status
func (h *PaymentHandler) GetPaymentStatus(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	status := h.paymentService.GetPaymentStatus(userID)
	c.JSON(http.StatusOK, status)
}

// GetPaymentHistory returns the user's payment history
func (h *PaymentHandler) GetPaymentHistory(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	payments, err := h.paymentService.GetPaymentHistory(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve payment history"})
		return
	}

	// Convert to response format
	var response []interface{}
	for _, p := range payments {
		response = append(response, p.ToResponse())
	}

	c.JSON(http.StatusOK, gin.H{"payments": response})
}

// GetViewedProjects returns projects the user has viewed
func (h *PaymentHandler) GetViewedProjects(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Not authenticated"})
		return
	}

	views, err := h.paymentService.GetViewedProjects(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve viewed projects"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"views": views})
}

// HandleStripeWebhook processes Stripe webhook events
func (h *PaymentHandler) HandleStripeWebhook(c *gin.Context) {
	payload, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read request body"})
		return
	}

	signature := c.GetHeader("Stripe-Signature")

	if err := h.paymentService.HandleStripeWebhook(payload, signature); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"received": true})
}

// GetStripeConfig returns Stripe configuration for frontend
func (h *PaymentHandler) GetStripeConfig(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"publishable_key": h.paymentService.GetStripePublishableKey(),
		"is_configured":   h.paymentService.IsStripeConfigured(),
	})
}
