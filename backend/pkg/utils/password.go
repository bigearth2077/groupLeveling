package utils

import "golang.org/x/crypto/bcrypt"

// HashPassword 加密密码
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 14) // 14 是 cost，越高越安全但也越慢
	return string(bytes), err
}

// CheckPasswordHash 比对密码
func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}
