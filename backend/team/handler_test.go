package team

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func newTestServer() *http.ServeMux {
	mux := http.NewServeMux()
	NewHandler(nil).Register(mux)
	return mux
}

func TestFollow_Stub_ReturnsNotImplementedWithEcho(t *testing.T) {
	mux := newTestServer()
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/v0/api4team/follow",
		strings.NewReader(`{"teamID":"t123"}`))
	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusNotImplemented {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusNotImplemented)
	}
	if body := rec.Body.String(); !strings.Contains(body, `"teamID":"t123"`) ||
		!strings.Contains(body, `"followed":false`) {
		t.Fatalf("unexpected body: %s", body)
	}
}

func TestFollow_MissingTeamID_Returns400(t *testing.T) {
	mux := newTestServer()
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/v0/api4team/follow",
		strings.NewReader(`{}`))
	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusBadRequest)
	}
}

func TestFollow_BadJSON_Returns400(t *testing.T) {
	mux := newTestServer()
	rec := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPost, "/v0/api4team/follow",
		strings.NewReader(`not-json`))
	mux.ServeHTTP(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusBadRequest)
	}
}
