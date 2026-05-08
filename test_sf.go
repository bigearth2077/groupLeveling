package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

func main() {
	key := "sk-cofjxfzxjxjwanydjnwtxglibdletcnscnuloecwadcfeycu"
	url := "https://api.siliconflow.cn/v1/chat/completions"
	reqBody := map[string]interface{}{
		"model": "deepseek-ai/DeepSeek-V3",
		"messages": []map[string]string{
			{"role": "user", "content": "hi"},
		},
	}
	b, _ := json.Marshal(reqBody)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(b))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+key)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	fmt.Println("Status:", resp.StatusCode)
	fmt.Println("Body:", string(body))
}
