package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
)

func main() {
	apiKey := os.Getenv("SILICONFLOW_API_KEY")
	if apiKey == "" {
		fmt.Println("Error: SILICONFLOW_API_KEY is empty in this environment.")
		// For testing we use the user's provided key
		apiKey = "sk-cofjxfzxjxjwanydjnwtxglibdletcnscnuloecwadcfeycu"
	}
	
	reqBody := map[string]interface{}{
		"model": "deepseek-ai/DeepSeek-V4-Flash",
		"messages": []map[string]string{
			{"role": "user", "content": "Hello"},
		},
	}
	jsonData, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest("POST", "https://api.siliconflow.cn/v1/chat/completions", bytes.NewBuffer(jsonData))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)
	
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("Error making request:", err)
		return
	}
	defer resp.Body.Close()
	
	body, _ := io.ReadAll(resp.Body)
	fmt.Printf("Status: %d\nResponse: %s\n", resp.StatusCode, string(body))
}
