package services

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/stripe/stripe-go/v76"
	"github.com/stripe/stripe-go/v76/paymentintent"
	"github.com/stripe/stripe-go/v76/webhook"
	"github.com/ukuvago/angelvault/internal/config"
	"github.com/ukuvago/angelvault/internal/database"
	"github.com/ukuvago/angelvault/internal/models"
)

type PaymentService struct {
	config *config.Config
}

func NewPaymentService(cfg *config.Config) *PaymentService {
	if cfg.StripeSecretKey != "" {
		stripe.Key = cfg.StripeSecretKey
	}
	return &PaymentService{config: cfg}
}

// CreatePaymentIntent creates a Stripe payment intent for view credits
func (s *PaymentService) CreatePaymentIntent(investorID uuid.UUID) (*models.Payment, string, error) {
	db := database.GetDB()

	// NOTE: Investors CAN purchase additional credits even if they have remaining views
	// This allows them to "top up" their credits

	// Create payment record
	payment := &models.Payment{
		InvestorID:        investorID,
		Amount:            s.config.ViewFeeAmount,
		Currency:          s.config.ViewFeeCurrency,
		Status:            models.PaymentStatusPending,
		ProjectsTotal:     s.config.MaxProjectViews,
		ProjectsRemaining: s.config.MaxProjectViews,
		Description:       "Project viewing credits - access to view up to 4 projects",
	}

	if err := db.Create(payment).Error; err != nil {
		return nil, "", err
	}

	// Create Stripe payment intent if configured
	var clientSecret string
	if s.config.StripeSecretKey != "" {
		params := &stripe.PaymentIntentParams{
			Amount:   stripe.Int64(payment.Amount),
			Currency: stripe.String(payment.Currency),
			Metadata: map[string]string{
				"payment_id":  payment.ID.String(),
				"investor_id": investorID.String(),
				"type":        "view_credits",
			},
			AutomaticPaymentMethods: &stripe.PaymentIntentAutomaticPaymentMethodsParams{
				Enabled: stripe.Bool(true),
			},
		}

		pi, err := paymentintent.New(params)
		if err != nil {
			// Rollback payment creation
			db.Delete(payment)
			return nil, "", err
		}

		payment.StripePaymentID = pi.ID
		payment.StripeClientSecret = pi.ClientSecret
		clientSecret = pi.ClientSecret

		if err := db.Save(payment).Error; err != nil {
			return nil, "", err
		}
	} else {
		// Demo mode - no Stripe configured
		clientSecret = "demo_mode"
	}

	return payment, clientSecret, nil
}

// ConfirmPayment confirms a payment has been completed
func (s *PaymentService) ConfirmPayment(paymentID uuid.UUID, stripePaymentID string) (*models.Payment, error) {
	db := database.GetDB()

	var payment models.Payment
	if err := db.First(&payment, "id = ?", paymentID).Error; err != nil {
		return nil, errors.New("payment not found")
	}

	if payment.Status != models.PaymentStatusPending {
		return nil, errors.New("payment already processed")
	}

	// Verify with Stripe if configured
	if s.config.StripeSecretKey != "" && stripePaymentID != "" {
		pi, err := paymentintent.Get(stripePaymentID, nil)
		if err != nil {
			return nil, err
		}

		if pi.Status != stripe.PaymentIntentStatusSucceeded {
			return nil, errors.New("payment not successful")
		}

		// Get receipt URL from charge
		if pi.LatestCharge != nil {
			payment.ReceiptURL = string(pi.LatestCharge.ReceiptURL)
		}
	}

	now := time.Now()
	payment.Status = models.PaymentStatusCompleted
	payment.CompletedAt = &now

	if err := db.Save(&payment).Error; err != nil {
		return nil, err
	}

	return &payment, nil
}

// DemoConfirmPayment confirms payment in demo mode (no Stripe)
func (s *PaymentService) DemoConfirmPayment(paymentID uuid.UUID) (*models.Payment, error) {
	db := database.GetDB()

	var payment models.Payment
	if err := db.First(&payment, "id = ?", paymentID).Error; err != nil {
		return nil, errors.New("payment not found")
	}

	if payment.Status != models.PaymentStatusPending {
		return nil, errors.New("payment already processed")
	}

	now := time.Now()
	payment.Status = models.PaymentStatusCompleted
	payment.CompletedAt = &now

	if err := db.Save(&payment).Error; err != nil {
		return nil, err
	}

	return &payment, nil
}

// HandleStripeWebhook processes Stripe webhook events
func (s *PaymentService) HandleStripeWebhook(payload []byte, signature string) error {
	if s.config.StripeWebhookSecret == "" {
		return errors.New("webhook secret not configured")
	}

	event, err := webhook.ConstructEvent(payload, signature, s.config.StripeWebhookSecret)
	if err != nil {
		return err
	}

	switch event.Type {
	case "payment_intent.succeeded":
		var pi stripe.PaymentIntent
		if err := event.Data.Raw.UnmarshalJSON(([]byte)(pi.ID)); err != nil {
			return err
		}
		// Payment confirmed via webhook
		paymentIDStr := pi.Metadata["payment_id"]
		if paymentIDStr != "" {
			paymentID, _ := uuid.Parse(paymentIDStr)
			s.ConfirmPayment(paymentID, pi.ID)
		}

	case "payment_intent.payment_failed":
		// Handle failed payment
		var pi stripe.PaymentIntent
		if err := event.Data.Raw.UnmarshalJSON(([]byte)(pi.ID)); err != nil {
			return err
		}
		paymentIDStr := pi.Metadata["payment_id"]
		if paymentIDStr != "" {
			paymentID, _ := uuid.Parse(paymentIDStr)
			s.FailPayment(paymentID)
		}
	}

	return nil
}

// FailPayment marks a payment as failed
func (s *PaymentService) FailPayment(paymentID uuid.UUID) error {
	db := database.GetDB()
	return db.Model(&models.Payment{}).
		Where("id = ?", paymentID).
		Update("status", models.PaymentStatusFailed).Error
}

// GetActivePayment gets an investor's active payment with remaining views
func (s *PaymentService) GetActivePayment(investorID uuid.UUID) (*models.Payment, error) {
	db := database.GetDB()

	var payment models.Payment
	err := db.Where("investor_id = ? AND status = ? AND projects_remaining > 0",
		investorID, models.PaymentStatusCompleted).
		Order("created_at DESC").
		First(&payment).Error

	if err != nil {
		return nil, err
	}

	return &payment, nil
}

// GetPaymentStatus returns the investor's payment status including all active credits
func (s *PaymentService) GetPaymentStatus(investorID uuid.UUID) *models.PaymentStatusResponse {
	db := database.GetDB()
	
	// Get all completed payments with remaining credits
	var payments []models.Payment
	db.Where("investor_id = ? AND status = ? AND projects_remaining > 0",
		investorID, models.PaymentStatusCompleted).
		Order("created_at ASC"). // Use oldest credits first
		Find(&payments)

	if len(payments) == 0 {
		return &models.PaymentStatusResponse{
			HasActivePayment:  false,
			ProjectsRemaining: 0,
			Message:           "No active credits. Purchase credits to view projects.",
		}
	}

	// Calculate total remaining credits across all payments
	totalRemaining := 0
	totalPurchased := 0
	for _, p := range payments {
		totalRemaining += p.ProjectsRemaining
		totalPurchased += p.ProjectsTotal
	}

	// Return the oldest payment with credits for the response
	resp := payments[0].ToResponse()
	return &models.PaymentStatusResponse{
		HasActivePayment:  true,
		Payment:           &resp,
		ProjectsRemaining: totalRemaining,
		ProjectsTotal:     totalPurchased,
		Message:           "",
	}
}

// UseViewCredit decrements the view credit and records the view
func (s *PaymentService) UseViewCredit(investorID, projectID uuid.UUID) error {
	db := database.GetDB()

	// Check if already viewed
	var existingView models.ProjectView
	if err := db.Where("investor_id = ? AND project_id = ?", investorID, projectID).
		First(&existingView).Error; err == nil {
		// Already viewed, no credit needed
		return nil
	}

	// Get oldest active payment with credits (FIFO - use oldest credits first)
	var payment models.Payment
	err := db.Where("investor_id = ? AND status = ? AND projects_remaining > 0",
		investorID, models.PaymentStatusCompleted).
		Order("created_at ASC").
		First(&payment).Error
	
	if err != nil {
		return errors.New("no active credits available - please purchase more credits to view projects")
	}

	if !payment.CanViewMore() {
		return errors.New("no remaining project views on this payment")
	}

	// Create view record
	view := &models.ProjectView{
		InvestorID: investorID,
		ProjectID:  projectID,
		PaymentID:  payment.ID,
		ViewedAt:   time.Now(),
	}

	if err := db.Create(view).Error; err != nil {
		return err
	}

	// Decrement credit
	payment.ProjectsRemaining--
	if err := db.Save(&payment).Error; err != nil {
		return err
	}

	// Check if investor has hit their limit (all credits used)
	var totalRemaining int64
	db.Model(&models.Payment{}).
		Where("investor_id = ? AND status = ? AND projects_remaining > 0",
			investorID, models.PaymentStatusCompleted).
		Select("COALESCE(SUM(projects_remaining), 0)").
		Scan(&totalRemaining)

	// Log if they've used all credits
	if totalRemaining == 0 {
		// This could trigger a notification or audit log
		// The audit service would be called here in production
	}

	return nil
}

// GetTotalRemainingCredits returns total credits across all active payments
func (s *PaymentService) GetTotalRemainingCredits(investorID uuid.UUID) int {
	db := database.GetDB()
	
	var total int64
	db.Model(&models.Payment{}).
		Where("investor_id = ? AND status = ? AND projects_remaining > 0",
			investorID, models.PaymentStatusCompleted).
		Select("COALESCE(SUM(projects_remaining), 0)").
		Scan(&total)
	
	return int(total)
}

// CanViewMoreProjects checks if investor has any credits remaining
func (s *PaymentService) CanViewMoreProjects(investorID uuid.UUID) bool {
	return s.GetTotalRemainingCredits(investorID) > 0
}

// HasViewedProject checks if an investor has already viewed a project
func (s *PaymentService) HasViewedProject(investorID, projectID uuid.UUID) bool {
	db := database.GetDB()

	var view models.ProjectView
	err := db.Where("investor_id = ? AND project_id = ?", investorID, projectID).First(&view).Error
	return err == nil
}

// GetPaymentHistory retrieves payment history for an investor
func (s *PaymentService) GetPaymentHistory(investorID uuid.UUID) ([]models.Payment, error) {
	db := database.GetDB()

	var payments []models.Payment
	err := db.Where("investor_id = ?", investorID).
		Order("created_at DESC").
		Find(&payments).Error

	return payments, err
}

// GetViewedProjects retrieves projects an investor has viewed
func (s *PaymentService) GetViewedProjects(investorID uuid.UUID) ([]models.ProjectView, error) {
	db := database.GetDB()

	var views []models.ProjectView
	err := db.Where("investor_id = ?", investorID).
		Preload("Project").
		Preload("Project.Category").
		Order("viewed_at DESC").
		Find(&views).Error

	return views, err
}

// IsStripeConfigured returns whether Stripe is set up
func (s *PaymentService) IsStripeConfigured() bool {
	return s.config.StripeSecretKey != ""
}

// GetStripePublishableKey returns the publishable key for frontend
func (s *PaymentService) GetStripePublishableKey() string {
	return s.config.StripePublishableKey
}
