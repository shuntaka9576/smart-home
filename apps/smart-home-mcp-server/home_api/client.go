package home_api

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"time"
)

var (
	APIBaseURL string
)

const (
	defaultTimeout = 30 * time.Second
	dateTimeFormat = "2006-01-02 15:04"
)

type Client struct {
	baseURL    string
	httpClient *http.Client
	apiKey     string
}

func NewClient() *Client {
	apiKey := os.Getenv("SMART_HOME_API_KEY")

	return &Client{
		baseURL: APIBaseURL,
		httpClient: &http.Client{
			Timeout: defaultTimeout,
		},
		apiKey: apiKey,
	}
}

type HomeCondition struct {
	CumulativeElectricEnergy float64   `json:"cumulativeElectricEnergy"`
	MeasuredInstanktaneous   float64   `json:"measuredInstantaneous"`
	Temperature              float64   `json:"temperature"`
	Humidity                 float64   `json:"humidity"`
	Illuminance              float64   `json:"illuminance"`
	ACStatus                 bool      `json:"acStatus"`
	CreatedAt                time.Time `json:"createdAt"`
	UpdatedAt                time.Time `json:"updatedAt"`
	ElectricEnergyDelta      float64   `json:"electricEnergyDelta"`
}

type HomeConditionResponse struct {
	HomeConditions []HomeCondition `json:"homeConditions"`
}

type ErrorResponse struct {
	Error string `json:"error"`
}

func (c *Client) GetHomeConditions(ctx context.Context, since, until string) ([]HomeCondition, error) {
	params := url.Values{}
	params.Add("since", since)
	params.Add("until", until)

	reqURL := fmt.Sprintf("%s/home-condition?%s", c.baseURL, params.Encode())

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, reqURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("x-api-key", c.apiKey)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var errResp ErrorResponse
		if err := json.NewDecoder(resp.Body).Decode(&errResp); err != nil {
			return nil, fmt.Errorf("failed to decode error response: %w", err)
		}
		return nil, fmt.Errorf("API error: %s", errResp.Error)
	}

	var response HomeConditionResponse
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return response.HomeConditions, nil
}

func (c *Client) WithTimeout(timeout time.Duration) *Client {
	c.httpClient.Timeout = timeout
	return c
}

func (c *Client) WithHTTPClient(httpClient *http.Client) *Client {
	c.httpClient = httpClient
	return c
}
