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

type MeetingHandler struct {
	meetingService *services.MeetingService
}

func NewMeetingHandler(meetingSvc *services.MeetingService) *MeetingHandler {
	return &MeetingHandler{meetingService: meetingSvc}
}

// ========================================
// INVESTOR ENDPOINTS
// ========================================

// CreateMeetingRequest creates a new meeting request
// Investor must sign NDA addendum as part of this process
func (h *MeetingHandler) CreateMeetingRequest(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	var req struct {
		ProjectID     uuid.UUID `json:"project_id" binding:"required"`
		Message       string    `json:"message" binding:"required"`
		ProposedTimes string    `json:"proposed_times"`
		MeetingType   string    `json:"meeting_type"`
		// NDA signature (required for project addendum)
		SignedName    string    `json:"signed_name" binding:"required"`
		SignatureData string    `json:"signature_data" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	input := &services.CreateMeetingRequestInput{
		ProjectID:     req.ProjectID,
		Message:       req.Message,
		ProposedTimes: req.ProposedTimes,
		MeetingType:   req.MeetingType,
	}

	meeting, err := h.meetingService.CreateMeetingRequest(
		userID,
		input,
		req.SignedName,
		req.SignatureData,
		c.ClientIP(),
		c.GetHeader("User-Agent"),
	)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":         "Meeting request sent successfully",
		"meeting_request": meeting.ToResponse(),
	})
}

// GetInvestorMeetingRequests returns all meeting requests for the investor
func (h *MeetingHandler) GetInvestorMeetingRequests(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	requests, err := h.meetingService.GetInvestorMeetingRequests(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch meeting requests"})
		return
	}

	// Convert to response format
	var response []models.MeetingRequestResponse
	for _, r := range requests {
		response = append(response, r.ToResponse())
	}

	c.JSON(http.StatusOK, gin.H{"meeting_requests": response})
}

// CancelMeetingRequest cancels a pending meeting request
func (h *MeetingHandler) CancelMeetingRequest(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	requestID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request ID"})
		return
	}

	if err := h.meetingService.CancelMeetingRequest(userID, requestID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Meeting request cancelled"})
}

// ========================================
// DEVELOPER ENDPOINTS
// ========================================

// GetDeveloperMeetingRequests returns all meeting requests for developer's projects
func (h *MeetingHandler) GetDeveloperMeetingRequests(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	requests, err := h.meetingService.GetDeveloperMeetingRequests(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch meeting requests"})
		return
	}

	// Convert to response format with investor details
	var response []gin.H
	for _, r := range requests {
		resp := gin.H{
			"id":                   r.ID,
			"project_id":           r.ProjectID,
			"message":              r.Message,
			"proposed_times":       r.ProposedTimes,
			"meeting_type":         r.MeetingType,
			"status":               r.Status,
			"requested_at":         r.RequestedAt,
			"expires_at":           r.ExpiresAt,
			"investor_nda_signed":  r.InvestorNDASignedAt != nil,
			"developer_nda_signed": r.DeveloperNDASignedAt != nil,
		}

		if r.Investor != nil {
			resp["investor"] = gin.H{
				"id":           r.Investor.ID,
				"name":         r.Investor.FullName(),
				"company_name": r.Investor.CompanyName,
				"email":        r.Investor.Email,
			}

			if r.Investor.InvestorProfile != nil {
				resp["investor_profile"] = gin.H{
					"investor_type": r.Investor.InvestorProfile.InvestorType,
					"bio":           r.Investor.InvestorProfile.Bio,
					"linkedin_url":  r.Investor.InvestorProfile.LinkedInURL,
					"focus_areas":   r.Investor.InvestorProfile.FocusAreas,
				}
			}
		}

		if r.Project != nil {
			resp["project_title"] = r.Project.Title
		}

		response = append(response, resp)
	}

	c.JSON(http.StatusOK, gin.H{"meeting_requests": response})
}

// RespondToMeetingRequest accepts or declines a meeting request
// Developer signs NDA when accepting
func (h *MeetingHandler) RespondToMeetingRequest(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	requestID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request ID"})
		return
	}

	var req struct {
		Accept          bool       `json:"accept"`
		ResponseMessage string     `json:"response_message"`
		ScheduledAt     *time.Time `json:"scheduled_at"`
		MeetingLink     string     `json:"meeting_link"`
		// NDA signature (required when accepting)
		SignedName      string     `json:"signed_name"`
		SignatureData   string     `json:"signature_data"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Require signature when accepting
	if req.Accept && (req.SignedName == "" || req.SignatureData == "") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "NDA signature required when accepting meeting request"})
		return
	}

	meeting, err := h.meetingService.RespondToMeetingRequest(
		userID,
		requestID,
		req.Accept,
		req.ResponseMessage,
		req.ScheduledAt,
		req.MeetingLink,
		req.SignedName,
		req.SignatureData,
		c.ClientIP(),
		c.GetHeader("User-Agent"),
	)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	status := "declined"
	if req.Accept {
		status = "accepted"
	}

	c.JSON(http.StatusOK, gin.H{
		"message":         "Meeting request " + status,
		"meeting_request": meeting.ToResponse(),
	})
}

// CompleteMeeting marks a meeting as completed
func (h *MeetingHandler) CompleteMeeting(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	requestID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request ID"})
		return
	}

	if err := h.meetingService.CompleteMeeting(userID, requestID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Meeting marked as completed"})
}

// ========================================
// SHARED ENDPOINTS
// ========================================

// GetMeetingRequest returns a single meeting request
func (h *MeetingHandler) GetMeetingRequest(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	requestID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request ID"})
		return
	}

	request, err := h.meetingService.GetMeetingRequest(requestID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	// Verify user is authorized
	isInvestor := request.InvestorID == userID
	isDeveloper := request.Project != nil && request.Project.DeveloperID == userID

	if !isInvestor && !isDeveloper {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized to view this request"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"meeting_request": request})
}

// SendMessage sends a message in a meeting thread
func (h *MeetingHandler) SendMessage(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)
	userRole, _ := middleware.GetUserRole(c)

	requestID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request ID"})
		return
	}

	var req struct {
		Content string `json:"content" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	message, err := h.meetingService.SendMessage(userID, requestID, req.Content, userRole)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":      "Message sent",
		"chat_message": message,
	})
}

// GetMessages returns all messages in a meeting thread
func (h *MeetingHandler) GetMessages(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	requestID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request ID"})
		return
	}

	// Verify authorization
	request, err := h.meetingService.GetMeetingRequest(requestID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	isInvestor := request.InvestorID == userID
	isDeveloper := request.Project != nil && request.Project.DeveloperID == userID

	if !isInvestor && !isDeveloper {
		c.JSON(http.StatusForbidden, gin.H{"error": "Not authorized"})
		return
	}

	messages, err := h.meetingService.GetMessages(requestID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch messages"})
		return
	}

	// Mark as read
	h.meetingService.MarkMessagesAsRead(userID, requestID)

	c.JSON(http.StatusOK, gin.H{"messages": messages})
}

// GetUnreadCount returns count of unread messages
func (h *MeetingHandler) GetUnreadCount(c *gin.Context) {
	userID, _ := middleware.GetUserID(c)

	count, err := h.meetingService.GetUnreadMessageCount(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get unread count"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"unread_count": count})
}
