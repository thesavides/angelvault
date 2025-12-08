package services

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/ukuvago/angelvault/internal/config"
	"github.com/ukuvago/angelvault/internal/database"
	"github.com/ukuvago/angelvault/internal/models"
)

type MeetingService struct {
	config     *config.Config
	ndaService *NDAService
}

func NewMeetingService(cfg *config.Config, ndaSvc *NDAService) *MeetingService {
	return &MeetingService{
		config:     cfg,
		ndaService: ndaSvc,
	}
}

// CreateMeetingRequestInput for creating a meeting request
type CreateMeetingRequestInput struct {
	ProjectID     uuid.UUID `json:"project_id" binding:"required"`
	Message       string    `json:"message" binding:"required"`
	ProposedTimes string    `json:"proposed_times"`
	MeetingType   string    `json:"meeting_type"` // video, phone, in_person
}

// CreateMeetingRequest creates a new meeting request from investor to developer
// Investor must have master NDA and will sign project addendum as part of this
func (s *MeetingService) CreateMeetingRequest(investorID uuid.UUID, input *CreateMeetingRequestInput, signedName, signatureData, ipAddress, userAgent string) (*models.MeetingRequest, error) {
	db := database.GetDB()

	// Verify investor exists
	var investor models.User
	if err := db.First(&investor, "id = ? AND role = ?", investorID, models.RoleInvestor).Error; err != nil {
		return nil, errors.New("investor not found")
	}

	// Verify project exists and is approved
	var project models.Project
	if err := db.First(&project, "id = ? AND status = ?", input.ProjectID, models.ProjectStatusApproved).Error; err != nil {
		return nil, errors.New("project not found or not available")
	}

	// Check if investor has master NDA
	ndaStatus := s.ndaService.GetMasterNDAStatus(investorID)
	if !ndaStatus.HasMasterNDA || !ndaStatus.MasterNDAValid {
		return nil, errors.New("master NDA required before requesting a meeting")
	}

	// Check if investor has already requested meeting for this project
	var existingRequest models.MeetingRequest
	if err := db.Where("investor_id = ? AND project_id = ? AND status IN ?", 
		investorID, input.ProjectID, 
		[]models.MeetingRequestStatus{models.MeetingStatusPending, models.MeetingStatusAccepted}).
		First(&existingRequest).Error; err == nil {
		return nil, errors.New("you already have a pending or accepted meeting request for this project")
	}

	// Sign project NDA addendum as part of meeting request
	projectNDAStatus := s.ndaService.GetProjectNDAStatus(investorID, input.ProjectID)
	if projectNDAStatus.RequiresAddendum && !projectNDAStatus.HasAddendum {
		// Sign the addendum
		_, err := s.ndaService.SignProjectAddendum(investorID, input.ProjectID, &SignNDARequest{
			SignedName:    signedName,
			SignatureData: signatureData,
		}, ipAddress, userAgent)
		if err != nil {
			return nil, errors.New("failed to sign project NDA addendum: " + err.Error())
		}
	}

	// Create meeting request
	meetingType := input.MeetingType
	if meetingType == "" {
		meetingType = "video"
	}

	now := time.Now()
	request := &models.MeetingRequest{
		InvestorID:          investorID,
		ProjectID:           input.ProjectID,
		Message:             input.Message,
		ProposedTimes:       input.ProposedTimes,
		MeetingType:         meetingType,
		Status:              models.MeetingStatusPending,
		InvestorNDASignedAt: &now,
		ExpiresAt:           time.Now().AddDate(0, 0, 14), // 14 days to respond
	}

	if err := db.Create(request).Error; err != nil {
		return nil, err
	}

	// Load relations
	db.Preload("Investor").Preload("Project").First(request, "id = ?", request.ID)

	return request, nil
}

// RespondToMeetingRequest allows developer to accept or decline a meeting request
// Developer signs NDA when accepting
func (s *MeetingService) RespondToMeetingRequest(
	developerID uuid.UUID,
	requestID uuid.UUID,
	accept bool,
	responseMessage string,
	scheduledAt *time.Time,
	meetingLink string,
	signedName string,
	signatureData string,
	ipAddress string,
	userAgent string,
) (*models.MeetingRequest, error) {
	db := database.GetDB()

	var request models.MeetingRequest
	if err := db.Preload("Project").First(&request, "id = ?", requestID).Error; err != nil {
		return nil, errors.New("meeting request not found")
	}

	// Verify developer owns the project
	if request.Project == nil || request.Project.DeveloperID != developerID {
		return nil, errors.New("not authorized to respond to this request")
	}

	if !request.CanRespond() {
		return nil, errors.New("meeting request cannot be responded to (expired or already processed)")
	}

	now := time.Now()
	request.RespondedAt = &now
	request.ResponseMessage = responseMessage

	if accept {
		request.Status = models.MeetingStatusAccepted
		request.ScheduledAt = scheduledAt
		request.MeetingLink = meetingLink
		request.DeveloperNDASignedAt = &now

		// TODO: In production, create a mutual NDA record for the developer
		// For now, we just track that they signed when accepting
	} else {
		request.Status = models.MeetingStatusDeclined
	}

	if err := db.Save(&request).Error; err != nil {
		return nil, err
	}

	return &request, nil
}

// CancelMeetingRequest allows investor to cancel their request
func (s *MeetingService) CancelMeetingRequest(investorID, requestID uuid.UUID) error {
	db := database.GetDB()

	var request models.MeetingRequest
	if err := db.First(&request, "id = ? AND investor_id = ?", requestID, investorID).Error; err != nil {
		return errors.New("meeting request not found")
	}

	if request.Status != models.MeetingStatusPending {
		return errors.New("can only cancel pending requests")
	}

	request.Status = models.MeetingStatusCancelled
	return db.Save(&request).Error
}

// CompleteMeeting marks a meeting as completed
func (s *MeetingService) CompleteMeeting(developerID, requestID uuid.UUID) error {
	db := database.GetDB()

	var request models.MeetingRequest
	if err := db.Preload("Project").First(&request, "id = ?", requestID).Error; err != nil {
		return errors.New("meeting request not found")
	}

	if request.Project == nil || request.Project.DeveloperID != developerID {
		return errors.New("not authorized")
	}

	if request.Status != models.MeetingStatusAccepted {
		return errors.New("meeting must be accepted before completing")
	}

	now := time.Now()
	request.Status = models.MeetingStatusCompleted
	request.CompletedAt = &now

	return db.Save(&request).Error
}

// GetInvestorMeetingRequests returns all meeting requests for an investor
func (s *MeetingService) GetInvestorMeetingRequests(investorID uuid.UUID) ([]models.MeetingRequest, error) {
	db := database.GetDB()

	var requests []models.MeetingRequest
	err := db.Where("investor_id = ?", investorID).
		Preload("Project").
		Preload("Project.Developer").
		Order("created_at DESC").
		Find(&requests).Error

	return requests, err
}

// GetDeveloperMeetingRequests returns all meeting requests for a developer's projects
func (s *MeetingService) GetDeveloperMeetingRequests(developerID uuid.UUID) ([]models.MeetingRequest, error) {
	db := database.GetDB()

	// Get all project IDs for this developer
	var projectIDs []uuid.UUID
	db.Model(&models.Project{}).
		Where("developer_id = ?", developerID).
		Pluck("id", &projectIDs)

	if len(projectIDs) == 0 {
		return []models.MeetingRequest{}, nil
	}

	var requests []models.MeetingRequest
	err := db.Where("project_id IN ?", projectIDs).
		Preload("Investor").
		Preload("Investor.InvestorProfile").
		Preload("Project").
		Order("created_at DESC").
		Find(&requests).Error

	return requests, err
}

// GetMeetingRequest returns a single meeting request
func (s *MeetingService) GetMeetingRequest(requestID uuid.UUID) (*models.MeetingRequest, error) {
	db := database.GetDB()

	var request models.MeetingRequest
	if err := db.Preload("Investor").
		Preload("Investor.InvestorProfile").
		Preload("Project").
		Preload("Project.Developer").
		First(&request, "id = ?", requestID).Error; err != nil {
		return nil, errors.New("meeting request not found")
	}

	return &request, nil
}

// SendMessage sends a message in a meeting request thread
func (s *MeetingService) SendMessage(senderID uuid.UUID, requestID uuid.UUID, content string, senderRole models.UserRole) (*models.Message, error) {
	db := database.GetDB()

	// Verify the meeting request exists and sender is authorized
	var request models.MeetingRequest
	if err := db.Preload("Project").First(&request, "id = ?", requestID).Error; err != nil {
		return nil, errors.New("meeting request not found")
	}

	// Check authorization
	isInvestor := request.InvestorID == senderID
	isDeveloper := request.Project != nil && request.Project.DeveloperID == senderID

	if !isInvestor && !isDeveloper {
		return nil, errors.New("not authorized to send messages in this thread")
	}

	message := &models.Message{
		MeetingRequestID: requestID,
		SenderID:         senderID,
		SenderRole:       senderRole,
		Content:          content,
	}

	if err := db.Create(message).Error; err != nil {
		return nil, err
	}

	return message, nil
}

// GetMessages returns all messages in a meeting request thread
func (s *MeetingService) GetMessages(requestID uuid.UUID) ([]models.Message, error) {
	db := database.GetDB()

	var messages []models.Message
	err := db.Where("meeting_request_id = ?", requestID).
		Preload("Sender").
		Order("created_at ASC").
		Find(&messages).Error

	return messages, err
}

// MarkMessagesAsRead marks all messages in a thread as read for a user
func (s *MeetingService) MarkMessagesAsRead(userID, requestID uuid.UUID) error {
	db := database.GetDB()

	now := time.Now()
	return db.Model(&models.Message{}).
		Where("meeting_request_id = ? AND sender_id != ? AND is_read = ?", requestID, userID, false).
		Updates(map[string]interface{}{
			"is_read": true,
			"read_at": now,
		}).Error
}

// GetUnreadMessageCount returns count of unread messages for a user
func (s *MeetingService) GetUnreadMessageCount(userID uuid.UUID) (int64, error) {
	db := database.GetDB()

	// Get all meeting requests where user is participant
	var user models.User
	if err := db.First(&user, "id = ?", userID).Error; err != nil {
		return 0, err
	}

	var requestIDs []uuid.UUID

	if user.Role == models.RoleInvestor {
		db.Model(&models.MeetingRequest{}).
			Where("investor_id = ?", userID).
			Pluck("id", &requestIDs)
	} else if user.Role == models.RoleDeveloper {
		var projectIDs []uuid.UUID
		db.Model(&models.Project{}).
			Where("developer_id = ?", userID).
			Pluck("id", &projectIDs)
		
		db.Model(&models.MeetingRequest{}).
			Where("project_id IN ?", projectIDs).
			Pluck("id", &requestIDs)
	}

	if len(requestIDs) == 0 {
		return 0, nil
	}

	var count int64
	db.Model(&models.Message{}).
		Where("meeting_request_id IN ? AND sender_id != ? AND is_read = ?", requestIDs, userID, false).
		Count(&count)

	return count, nil
}

// ExpirePendingRequests expires meeting requests that have passed their expiry date
func (s *MeetingService) ExpirePendingRequests() (int64, error) {
	db := database.GetDB()

	result := db.Model(&models.MeetingRequest{}).
		Where("status = ? AND expires_at < ?", models.MeetingStatusPending, time.Now()).
		Update("status", models.MeetingStatusExpired)

	return result.RowsAffected, result.Error
}
