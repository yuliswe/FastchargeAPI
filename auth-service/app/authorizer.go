package main

import (
	"crypto/rsa"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strconv"
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
		fmt.Println(color.Yellow + "Try parsing as anonymous user:" + color.Reset)
		if isAnonymous, err := isAnonymousUser(auth); isAnonymous {
			return allowedAnonymousUser(), nil
		} else {
			fmt.Println(color.Red, "This is not an anonymous user. Reason:", err, color.Reset)
		}
	}

	if os.Getenv("AllowUserAppToken") == "1" {
		apiKey := request.Headers["X-FAST-API-KEY"]
		if apiKey == "" {
			apiKey = request.Headers["x-fast-api-key"]
		}
		fmt.Println(color.Yellow + "Try parsing as an app token:" + color.Reset)
		if user, err := verifyUserAppToken(apiKey); err == nil {
			return allowed(user), nil
		} else {
			fmt.Println(color.Red, "This is not a valid user app token. Reason:", err, color.Reset)
		}
	}

	fmt.Println(color.Yellow + "Try parsing as a Firebase token:" + color.Reset)
	if user, err := verifyFirebaseIdToken(auth); err == nil {
		return allowed(user), nil
	} else {
		fmt.Println(color.Red, "This is not a valid firebase token. Reason:", err, color.Reset)
	}

	fmt.Println(color.Yellow + "Try parsing as a token signed by us:" + color.Reset)
	if user, err := verifyFastchargeAPISignedIdToken(auth); err == nil {
		return allowed(user), nil
	} else {
		fmt.Println(color.Red, "This is not a token signed by us. Reason:", err, color.Reset)
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
			"isAdminUser":     strconv.FormatBool(user.Email == "fastchargeapi@gmail.com"),
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
		return "", err
	}
	claims, ok := tokenUnchecked.Claims.(jwt.MapClaims)
	if !ok {
		return "", errors.New(fmt.Sprint("Parsing id token: claims is not a map. Got: ", tokenUnchecked.Claims))
	}
	firebase, ok := claims["firebase"].(map[string]interface{})
	if !ok {
		return "", errors.New(fmt.Sprint("Parsing id token: firebase is not a map. Got: ", claims["firebase"]))
	}
	provider, ok := firebase["sign_in_provider"].(string)
	if !ok {
		return "", errors.New(fmt.Sprint("Parsing id token: sign_in_provider is not a string."+color.Reset, "Got: ", firebase["sign_in_provider"]))
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
		return nil, errors.New(fmt.Sprint("Parsing id token: ", err.Error()))
	}
	if tokenUnchecked.Header["kid"] == nil {
		return nil, errors.New(fmt.Sprint("Parsing id token: kid is nil"))
	}
	kid, ok := tokenUnchecked.Header["kid"].(string)
	if !ok {
		return nil, errors.New(fmt.Sprint("Parsing id token: kid is not a string"))
	}
	googleCert, err := getGoogleCert(kid)
	if googleCert == nil {
		return nil, errors.New(fmt.Sprint("Error getting google cert (not found kid):", "kid: ", kid, "err: ", err.Error()))
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
		return nil, errors.New(fmt.Sprint("Verifying id token: ", err.Error()))
	}
	// Verify the token is valid
	if !token.Valid {
		return nil, errors.New("Invalid token")
	}
	claims := token.Claims.(jwt.MapClaims)
	email, ok := claims["email"].(string)
	if !ok {
		return nil, errors.New("Parsing id token: email is not a string")
	}
	sub, ok := claims["sub"].(string)
	if !ok {
		return nil, errors.New("Parsing id token: sub is not a string")
	}
	firebaseClaim := UserClaims{
		Email: email,
		Sub:   sub,
	}
	return &firebaseClaim, nil
}

// Used for testing function to log in a user without using Firebase. This
// essentially allows us to log in as any user we want, using a token that's
// signed by us.
func verifyFastchargeAPISignedIdToken(idToken string) (*UserClaims, error) {
	return verifyUserAppTokenWithPubKey(idToken, getFastchargeAPISignedIdTokenPublicKey())
}

func verifyUserAppToken(idToken string) (*UserClaims, error) {
	return verifyUserAppTokenWithPubKey(idToken, getUserAppTokenPublicKey())
}

func verifyUserAppTokenWithPubKey(idToken string, pubkey string) (*UserClaims, error) {
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
			pem := pubkey
			if key, err := jwt.ParseECPublicKeyFromPEM([]byte(pem)); err != nil {
				return nil, errors.New(fmt.Sprint("Error decoding google cert: ", err.Error()))
			} else {
				return key, nil
			}
		})
	if err != nil {
		return nil, errors.New(fmt.Sprint("Error verifying id token: ", err.Error()))
	}
	// Verify the token is valid
	if !token.Valid {
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

func getFastchargeAPISignedIdTokenPublicKey() string {
	return "-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEeaXYnU+ciCdZ2MgYmT3soYlmJbQX\n1obNviKMHV1G6CTilMFht5XGfnsu32nMfWobAzxE5IZcbX/dV3okT56p4A==\n-----END PUBLIC KEY-----\n"
}
