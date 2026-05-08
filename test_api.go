package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

func main() {
	// Login as test user
	loginReq := map[string]string{"email": "test@test.com", "password": "123456"}
	lb, _ := json.Marshal(loginReq)
	resp, err := http.Post("http://localhost:8080/auth/login", "application/json", bytes.NewBuffer(lb))
	if err != nil {
		fmt.Println("Login err:", err)
		return
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	
	var res map[string]interface{}
	json.Unmarshal(body, &res)
	token, _ := res["accessToken"].(string)

	// Fetch AI report
	req, _ := http.NewRequest("GET", "http://localhost:8080/health/ai-report", nil)
	req.Header.Set("Authorization", "Bearer "+token)
	resp2, err2 := http.DefaultClient.Do(req)
	if err2 != nil {
		fmt.Println("Report err:", err2)
		return
	}
	defer resp2.Body.Close()
	body2, _ := io.ReadAll(resp2.Body)
	fmt.Printf("HTTP Status: %d\n", resp2.StatusCode)
	fmt.Printf("HTTP Body: %s\n", string(body2))
}
