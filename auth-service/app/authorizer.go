package main

import (
	"crypto/rsa"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"time"

	"github.com/TwiN/go-color"
	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/golang-jwt/jwt/v5"
	"k8s.io/client-go/tools/cache"
)

func main() {
	lambda.Start(lambdaHandler)
}

func lambdaHandler(request events.APIGatewayV2CustomAuthorizerV2Request) (*events.APIGatewayV2CustomAuthorizerIAMPolicyResponse, error) {
	if request.RequestContext.HTTP.Method == "OPTIONS" {
		return allowPreflight(), nil
	}

	auth := request.Headers["Authorization"]
	if auth == "" {
		auth = request.Headers["authorization"]
	}

	if os.Getenv("AllowAnonymousUser") == "1" {
		if isAnonymous, _ := isAnonymousUser(auth); isAnonymous {
			return allowedAnonymousUser(), nil
		}
	}

	if os.Getenv("AllowUserAppToken") == "1" {
		apiKey := request.Headers["X-FAST-API-KEY"]
		if apiKey == "" {
			apiKey = request.Headers["x-fast-api-key"]
		}
		if user, err := verifyUserAppToken(apiKey); err == nil {
			return allowed(user), nil
		} else {
			fmt.Println(color.Red, "This is not a valid user app token. Reason:", err, color.Reset)
		}
	}

	if user, err := verifyFirebaseIdToken(auth); err == nil {
		return allowed(user), nil
	} else {
		fmt.Println(color.Red, "This is not a valid firebase token. Reason:", err, color.Reset)
	}

	return denied(), nil
}

func allowPreflight() *events.APIGatewayV2CustomAuthorizerIAMPolicyResponse {
	return &events.APIGatewayV2CustomAuthorizerIAMPolicyResponse{
		PrincipalID: "CORS_PREFLIGHT",
		PolicyDocument: events.APIGatewayCustomAuthorizerPolicy{
			Version: "2012-10-17",
			Statement: []events.IAMPolicyStatement{
				{
					Action:   []string{"execute-api:Invoke"},
					Effect:   "Allow",
					Resource: []string{"arn:aws:execute-api:*:*:*"},
				},
			},
		},
		Context: map[string]interface{}{
			"isAnonymousUser": "true",
		},
	}
}

func allowed(user *UserClaims) *events.APIGatewayV2CustomAuthorizerIAMPolicyResponse {
	return &events.APIGatewayV2CustomAuthorizerIAMPolicyResponse{
		PrincipalID: user.Sub,
		PolicyDocument: events.APIGatewayCustomAuthorizerPolicy{
			Version: "2012-10-17",
			Statement: []events.IAMPolicyStatement{
				{
					Action:   []string{"execute-api:Invoke"},
					Effect:   "Allow",
					Resource: []string{"arn:aws:execute-api:*:*:*"},
				},
			},
		},
		Context: map[string]interface{}{
			"isAnonymousUser": "false",
			"userEmail":       user.Email,
			"userPK":          user.UserPK,
			"firebaseUserId":  user.Sub,
		},
	}
}

func allowedAnonymousUser() *events.APIGatewayV2CustomAuthorizerIAMPolicyResponse {
	return &events.APIGatewayV2CustomAuthorizerIAMPolicyResponse{
		PrincipalID: "ANONYMOUS_USER",
		PolicyDocument: events.APIGatewayCustomAuthorizerPolicy{
			Version: "2012-10-17",
			Statement: []events.IAMPolicyStatement{
				{
					Action:   []string{"execute-api:Invoke"},
					Effect:   "Allow",
					Resource: []string{"arn:aws:execute-api:*:*:*"},
				},
			},
		},
		Context: map[string]interface{}{
			"isAnonymousUser": "true",
		},
	}
}

func denied() *events.APIGatewayV2CustomAuthorizerIAMPolicyResponse {
	return &events.APIGatewayV2CustomAuthorizerIAMPolicyResponse{
		PrincipalID: "DENIED",
		PolicyDocument: events.APIGatewayCustomAuthorizerPolicy{
			Version: "2012-10-17",
			Statement: []events.IAMPolicyStatement{
				{
					Action:   []string{"execute-api:Invoke"},
					Effect:   "Deny",
					Resource: []string{"arn:aws:execute-api:*:*:*"},
				},
			},
		},
	}
}

var googleCertCache cache.Store = cache.NewTTLStore(func(obj interface{}) (string, error) {
	return obj.(*GoogleCert).kid, nil
}, 24*time.Hour)

type GoogleCert struct {
	kid    string
	cert   string
	rsaKey *rsa.PublicKey
}

// Get Google public certificates and cache for 24 hours.
// Google returns multiple certs, identified by kid
func getGoogleCert(kid string) (*GoogleCert, error) {
	// Check cache, if found return
	if cert, found, _ := googleCertCache.GetByKey(kid); found {
		return cert.(*GoogleCert), nil
	}
	// Cache miss, get certs from Google
	// Google returns multiple certs, identified by kid
	resp, err := http.Get("https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com")
	if err != nil {
		fmt.Println(color.Red + "Error getting google cert: " + err.Error() + color.Reset)
		return nil, err
	}
	defer resp.Body.Close()
	var googleCert map[string]string
	if err := json.NewDecoder(resp.Body).Decode(&googleCert); err != nil {
		fmt.Println(color.Red + "Error decoding google cert: " + err.Error() + color.Reset)
		return nil, err
	}
	// Add certs to cache
	for k, v := range googleCert {
		if rsaKey, err := jwt.ParseRSAPublicKeyFromPEM([]byte(v)); err != nil {
			fmt.Println(color.Red + "Error decoding google cert: " + err.Error() + color.Reset)
			return nil, err
		} else if rsaKey == nil {
			fmt.Println(color.Red + "Error decoding google cert: " + "rsaKey is nil" + color.Reset)
			return nil, err
		} else {
			googleCertCache.Add(&GoogleCert{
				kid:    k,
				cert:   v,
				rsaKey: rsaKey,
			})
		}
	}
	if cert, found, err := googleCertCache.GetByKey(kid); found {
		return cert.(*GoogleCert), nil
	} else if err != nil {
		fmt.Println(color.Red + "Error getting google cert: " + err.Error() + color.Reset)
		return nil, err
	} else {
		// Cert not found, happens when Google rotates certs
		fmt.Println(color.Red + "Error getting google cert: " + "Cert not found, token must have been signed with a old cert" + color.Reset)
		return nil, errors.New("Cert not found, token must have been signed with a old cert")
	}
}

func isAnonymousUser(idToken string) (bool, error) {
	provider, err := getSignInProvider(idToken)
	if err != nil {
		return false, err
	}
	if provider == "anonymous" {
		return true, nil
	}
	return false, nil
}

func getSignInProvider(idToken string) (string, error) {
	tokenUnchecked, _, err := jwt.NewParser().ParseUnverified(idToken, jwt.MapClaims{})
	if err != nil {
		fmt.Println(color.Red + "Error parsing id token: " + err.Error() + color.Reset)
		return "", err
	}

	claims, ok := tokenUnchecked.Claims.(jwt.MapClaims)
	if !ok {
		fmt.Println(color.Yellow + "Parsing id token:  claims is not a map." + color.Reset)
		return "", errors.New("Parsing id token: claims is not a map.")
	}
	firebase, ok := claims["firebase"].(map[string]interface{})
	if !ok {
		fmt.Println(color.Yellow+"Parsing id token: firebase is not a map."+color.Reset, claims["firebase"])
		return "", errors.New("Parsing id token: firebase is not a map.")
	}
	provider, ok := firebase["sign_in_provider"].(string)
	if !ok {
		fmt.Println(color.Yellow+"Parsing id token: sign_in_provider is not a string."+color.Reset, firebase["sign_in_provider"])
		return "", errors.New("Parsing id token: sign_in_provider is not a string.")
	}
	return provider, nil
}

type UserClaims struct {
	Email  string `json:"email,omitempty"`
	UserPK string `json:"userPK,omitempty"`
	Sub    string `json:"sub,omitempty"`
}

func verifyFirebaseIdToken(idToken string) (*UserClaims, error) {
	// To verify the signature, first find out which public key certificate was
	// used to sign the JWT. The key is identified by the key ID (kid) in the
	// idToken header.
	tokenUnchecked, _, err := jwt.NewParser().ParseUnverified(idToken, jwt.MapClaims{})
	if err != nil {
		fmt.Println(color.Red + "Error parsing id token: " + err.Error() + color.Reset)
		return nil, err
	}
	if tokenUnchecked.Header["kid"] == nil {
		fmt.Println(color.Red + "Error parsing id token: " + "kid is nil" + color.Reset)
		return nil, errors.New("kid is nil")
	}
	kid, ok := tokenUnchecked.Header["kid"].(string)
	if !ok {
		fmt.Println(color.Red + "Error parsing id token: " + "kid is not a string" + color.Reset)
		return nil, errors.New("kid is not a string")
	}
	googleCert, err := getGoogleCert(kid)
	if googleCert == nil {
		fmt.Println(color.Red + "Error getting google cert (not found kid): " + kid + " " + err.Error() + color.Reset)
		return nil, err
	}
	token, err := jwt.NewParser(
		jwt.WithAudience("fastchargeapi"),
		jwt.WithIssuedAt(),
		jwt.WithIssuer("https://securetoken.google.com/fastchargeapi"),
		jwt.WithValidMethods([]string{"RS256"}),
	).Parse(idToken,
		// Find the public key certificate corresponding to the key ID (kid)
		func(token *jwt.Token) (interface{}, error) {
			return googleCert.rsaKey, nil
		})
	if err != nil {
		fmt.Println(color.Red + "Error verifying id token: " + err.Error() + color.Reset)
		return nil, err
	}
	// Verify the token is valid
	if !token.Valid {
		fmt.Println(color.Red + "Invalid token" + color.Reset)
		return nil, errors.New("Invalid token")
	}
	claims := token.Claims.(jwt.MapClaims)
	email, ok := claims["email"].(string)
	if !ok {
		fmt.Println(color.Red + "Error parsing id token: email is not a string" + color.Reset)
		return nil, errors.New("Error parsing id token: email is not a string")
	}
	sub, ok := claims["sub"].(string)
	if !ok {
		fmt.Println(color.Red + "Error parsing id token: sub is not a string" + color.Reset)
		return nil, errors.New("Error parsing id token: sub is not a string")
	}
	firebaseClaim := UserClaims{
		Email: email,
		Sub:   sub,
	}
	return &firebaseClaim, nil
}

func verifyUserAppToken(idToken string) (*UserClaims, error) {
	// To verify the signature, first find out which public key certificate was
	// used to sign the JWT. The key is identified by the key ID (kid) in the
	// idToken header.
	token, err := jwt.NewParser(
		jwt.WithIssuedAt(),
		jwt.WithIssuer("fastchargeapi.com"),
		jwt.WithValidMethods([]string{"ES256"}),
	).Parse(idToken,
		// Find the public key certificate corresponding to the key ID (kid)
		func(token *jwt.Token) (interface{}, error) {
			pem := getUserAppTokenPublicKey()
			if key, err := jwt.ParseECPublicKeyFromPEM([]byte(pem)); err != nil {
				fmt.Println(color.Red + "Error decoding google cert: " + err.Error() + color.Reset)
				return nil, err
			} else {
				return key, nil
			}
		})
	if err != nil {
		fmt.Println(color.Red + "Error verifying id token: " + err.Error() + color.Reset)
		return nil, err
	}
	// Verify the token is valid
	if !token.Valid {
		fmt.Println(color.Red + "Invalid token" + color.Reset)
		return nil, errors.New("Invalid token")
	}
	claims := token.Claims
	userAppTokenClaims := UserClaims{
		UserPK: claims.(jwt.MapClaims)["userPK"].(string),
		Sub:    "",
	}
	return &userAppTokenClaims, nil
}

func getUserAppTokenPublicKey() string {
	return "-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE9CR7SW0cTqQBG1vxWnkjk5dO7zfv\nUeueXgubjSD6i6vcmHdetZ25/ItESQDBmX0LL2qYaPzqTJHbWKxqL+6CtA==\n-----END PUBLIC KEY-----\n"
}
