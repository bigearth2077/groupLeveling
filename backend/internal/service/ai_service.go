package service

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

type AIService struct{}

const (
	siliconFlowBaseURL = "https://api.siliconflow.cn/v1/chat/completions"
	siliconFlowModel   = "deepseek-ai/DeepSeek-V3"
)

// AIAnalysisResult 博客分析结果
type AIAnalysisResult struct {
	Tags      []string `json:"tags"`
	Summary   string   `json:"summary"`
	XpPerTag  int      `json:"xpPerTag"`
	Quality   string   `json:"quality"`
	Reasoning string   `json:"reasoning"`
}

type openaiMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type openaiRequest struct {
	Model    string          `json:"model"`
	Messages []openaiMessage `json:"messages"`
}

type openaiResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

// AnalyzeBlogContent 分析博客内容并评估 XP
func (s *AIService) AnalyzeBlogContent(title, content string, popularTags []string) (*AIAnalysisResult, error) {
	apiKey := os.Getenv("SILICONFLOW_API_KEY")
	if apiKey == "" || apiKey == "your_siliconflow_api_key_here" {
		return nil, errors.New("SILICONFLOW_API_KEY is not configured")
	}

	tagListStr := strings.Join(popularTags, ", ")

	systemPrompt := fmt.Sprintf(`你是 GroupLeveling 学习平台的内容评估AI。平台使用 XP 经验值系统：
经验体系规则：
- 1 分钟学习 = 1 XP（通过番茄钟获得）
- 等级公式：80级以下 XP = 9.375 × Level²，80级以上线性增长
- 示例：10级需要 938 XP（≈15.6小时），20级需要 3750 XP（≈62.5小时）
- 用户的每个技能标签有独立的等级

你的任务是分析用户发布的学习笔记/博客，返回严格的 JSON 格式（不要包含任何 markdown 代码块标记，只能输出 JSON 对象）：
{
  "tags": ["标签1", "标签2"],
  "summary": "50字以内的中文摘要",
  "xpPerTag": 数字,
  "quality": "basic"或"good"或"excellent",
  "reasoning": "简要说明XP评估理由"
}

XP 评估参考标准：
- 一篇有深度的技术分享（含代码示例、原理分析）：15-30 XP/tag
- 一篇学习心得/经验总结（有个人思考）：8-15 XP/tag  
- 一篇简单记录/笔记（较短或缺乏深度）：3-8 XP/tag
- 灌水/无实质内容：0 XP

注意：XP 代表"等价学习分钟数"，请合理评估这篇内容的知识产出是否值得对应的学习时间。
已有热门标签参考（优先匹配）：%s`, tagListStr)

	userPrompt := fmt.Sprintf("博客标题：%s\n博客内容：\n%s", title, content)

	reqBody := openaiRequest{
		Model: siliconFlowModel,
		Messages: []openaiMessage{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: userPrompt},
		},
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", siliconFlowBaseURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{
		Timeout: 30 * time.Second,
	}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("AI API call failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("AI API returned status %d: %s", resp.StatusCode, string(body))
	}

	var aiResp openaiResponse
	if err := json.Unmarshal(body, &aiResp); err != nil {
		return nil, fmt.Errorf("failed to parse AI response: %w", err)
	}

	if len(aiResp.Choices) == 0 {
		return nil, errors.New("AI returned empty choices")
	}

	contentStr := aiResp.Choices[0].Message.Content
	
	// Robust JSON extraction
	start := strings.Index(contentStr, "{")
	end := strings.LastIndex(contentStr, "}")
	if start != -1 && end != -1 && end >= start {
		contentStr = contentStr[start : end+1]
	} else {
		// Fallback clean up
		contentStr = strings.TrimSpace(contentStr)
		contentStr = strings.TrimPrefix(contentStr, "```json")
		contentStr = strings.TrimPrefix(contentStr, "```")
		contentStr = strings.TrimSuffix(contentStr, "```")
		contentStr = strings.TrimSpace(contentStr)
	}

	var result AIAnalysisResult
	if err := json.Unmarshal([]byte(contentStr), &result); err != nil {
		return nil, fmt.Errorf("failed to parse AI JSON result: %w\nRaw string: %s", err, contentStr)
	}

	// 安全校验
	if len(result.Tags) > 5 {
		result.Tags = result.Tags[:5]
	}
	if result.XpPerTag < 0 {
		result.XpPerTag = 0
	}
	if result.XpPerTag > 100 { // 防止 AI 给太多
		result.XpPerTag = 100
	}
	if result.Quality != "basic" && result.Quality != "good" && result.Quality != "excellent" {
		result.Quality = "basic"
	}

	return &result, nil
}

// AIHealthReport 结构体
type AIHealthReport struct {
	OverallScore int      `json:"overallScore"`
	Insights     []string `json:"insights"`
	Advice       []string `json:"advice"`
	Warnings     []string `json:"warnings"`
}

// GenerateHealthReport 调用 AI 生成健康报告
func (s *AIService) GenerateHealthReport(userDataSummary string) (*AIHealthReport, error) {
	apiKey := os.Getenv("SILICONFLOW_API_KEY")
	if apiKey == "" || apiKey == "your_siliconflow_api_key_here" {
		return nil, errors.New("SILICONFLOW_API_KEY is not configured")
	}

	systemPrompt := `你是 GroupLeveling 学习平台的健康顾问AI。根据用户的学习数据和每日自评数据，提供个性化的学习和生活建议。

请返回严格的 JSON 格式（不要包含任何 markdown 代码块标记，只能输出 JSON 对象）：
{
  "overallScore": 0-100,
  "insights": ["洞察1", "洞察2"],
  "advice": ["建议1", "建议2", "建议3"],
  "warnings": ["警告1"]
}

请基于数据给出实际有帮助的建议，避免空洞的鸡汤。Warnings数组可以为空如果一切良好。`

	reqBody := openaiRequest{
		Model: siliconFlowModel,
		Messages: []openaiMessage{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: userDataSummary},
		},
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", siliconFlowBaseURL, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{
		Timeout: 30 * time.Second,
	}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("AI API call failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("AI API returned status %d: %s", resp.StatusCode, string(body))
	}

	var aiResp openaiResponse
	if err := json.Unmarshal(body, &aiResp); err != nil {
		return nil, fmt.Errorf("failed to parse AI response: %w", err)
	}

	if len(aiResp.Choices) == 0 {
		return nil, errors.New("AI returned empty choices")
	}

	contentStr := aiResp.Choices[0].Message.Content
	
	// Robust JSON extraction
	start := strings.Index(contentStr, "{")
	end := strings.LastIndex(contentStr, "}")
	if start != -1 && end != -1 && end >= start {
		contentStr = contentStr[start : end+1]
	} else {
		contentStr = strings.TrimSpace(contentStr)
		contentStr = strings.TrimPrefix(contentStr, "```json")
		contentStr = strings.TrimPrefix(contentStr, "```")
		contentStr = strings.TrimSuffix(contentStr, "```")
		contentStr = strings.TrimSpace(contentStr)
	}

	var result AIHealthReport
	if err := json.Unmarshal([]byte(contentStr), &result); err != nil {
		return nil, fmt.Errorf("failed to parse AI JSON result: %w\nRaw string: %s", err, contentStr)
	}

	if result.OverallScore < 0 {
		result.OverallScore = 0
	}
	if result.OverallScore > 100 {
		result.OverallScore = 100
	}

	return &result, nil
}
