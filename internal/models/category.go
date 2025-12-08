package models

import (
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Category struct {
	ID           uuid.UUID      `gorm:"type:uuid;primary_key;default:gen_random_uuid()" json:"id"`
	Name         string         `gorm:"uniqueIndex;not null" json:"name"`
	Slug         string         `gorm:"uniqueIndex;not null" json:"slug"`
	Description  string         `json:"description,omitempty"`
	Icon         string         `json:"icon,omitempty"`        // Emoji or icon class
	IconURL      string         `json:"icon_url,omitempty"`    // Custom uploaded icon
	Color        string         `json:"color,omitempty"`       // Brand color (hex)
	DisplayOrder int            `gorm:"default:0" json:"display_order"`
	IsActive     bool           `gorm:"default:true" json:"is_active"`
	
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`

	// Computed (not stored)
	ProjectCount int            `gorm:"-" json:"project_count,omitempty"`
	
	// Relations
	Projects     []Project      `gorm:"foreignKey:CategoryID" json:"-"`
}

func (c *Category) BeforeCreate(tx *gorm.DB) error {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	if c.Slug == "" {
		c.Slug = strings.ToLower(strings.ReplaceAll(c.Name, " ", "-"))
	}
	return nil
}

// CategoryWithCount includes the project count
type CategoryWithCount struct {
	ID           uuid.UUID `json:"id"`
	Name         string    `json:"name"`
	Slug         string    `json:"slug"`
	Description  string    `json:"description,omitempty"`
	Icon         string    `json:"icon,omitempty"`
	IconURL      string    `json:"icon_url,omitempty"`
	Color        string    `json:"color,omitempty"`
	ProjectCount int64     `json:"project_count"`
}

// Default categories to seed
var DefaultCategories = []Category{
	{Name: "FinTech", Slug: "fintech", Icon: "💳", Color: "#00CED1", Description: "Financial technology and services"},
	{Name: "HealthTech", Slug: "healthtech", Icon: "🏥", Color: "#FF6B6B", Description: "Healthcare and medical technology"},
	{Name: "EdTech", Slug: "edtech", Icon: "📚", Color: "#9B59B6", Description: "Educational technology platforms"},
	{Name: "AgriTech", Slug: "agritech", Icon: "🌾", Color: "#27AE60", Description: "Agricultural technology solutions"},
	{Name: "CleanTech", Slug: "cleantech", Icon: "🌱", Color: "#2ECC71", Description: "Clean energy and sustainability"},
	{Name: "E-Commerce", Slug: "ecommerce", Icon: "🛒", Color: "#E67E22", Description: "Online retail and marketplaces"},
	{Name: "SaaS", Slug: "saas", Icon: "☁️", Color: "#3498DB", Description: "Software as a Service"},
	{Name: "AI/ML", Slug: "ai-ml", Icon: "🤖", Color: "#8E44AD", Description: "Artificial intelligence and machine learning"},
	{Name: "Logistics", Slug: "logistics", Icon: "📦", Color: "#F39C12", Description: "Supply chain and logistics"},
	{Name: "PropTech", Slug: "proptech", Icon: "🏠", Color: "#1ABC9C", Description: "Real estate technology"},
	{Name: "InsurTech", Slug: "insurtech", Icon: "🛡️", Color: "#34495E", Description: "Insurance technology"},
	{Name: "Other", Slug: "other", Icon: "💡", Color: "#95A5A6", Description: "Other innovative ventures"},
}
