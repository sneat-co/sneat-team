// Package team is the sneat.team extension's backend implementation.
//
// It is intentionally a skeleton: the only route is a `follow` stub. The
// public wire contract (DTOs) lives in the sibling contract repo
// github.com/sneat-co/sneat-team-ext/backend/team and is consumed here, mirroring
// how the gameboard backend consumes gameboard-ext. This module imports only the
// contract + foundational packages — never sneat-go.
package team

import (
	"encoding/json"
	"net/http"

	contract "github.com/sneat-co/sneat-team-ext/backend/team"
)

// Store is the persistence dependency. It is a placeholder until the team
// management surface (clubs/teams/rosters) is specified and implemented.
type Store interface{}

// Handler exposes the api4team HTTP surface.
type Handler struct {
	store Store
}

// NewHandler constructs a Handler.
func NewHandler(store Store) *Handler { return &Handler{store: store} }

// Register wires the api4team routes onto mux (Go 1.22 method+pattern mux).
//
//	POST /v0/api4team/follow — subscribe to a team's updates (STUB)
func (h *Handler) Register(mux *http.ServeMux) {
	mux.HandleFunc("POST /v0/api4team/follow", h.follow)
}

// follow is a STUB: it parses the contract request and echoes a contract
// response without persisting anything. Real subscription logic lands when the
// follow contract is reconciled with sports/gameboard-live.
func (h *Handler) follow(w http.ResponseWriter, r *http.Request) {
	var req contract.FollowTeamRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "bad_request", "message": "invalid follow body",
		})
		return
	}
	if req.TeamID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{
			"error": "bad_request", "message": "teamID is required",
		})
		return
	}
	// STUB: no persistence yet.
	writeJSON(w, http.StatusNotImplemented, contract.FollowTeamResponse{
		TeamID:   req.TeamID,
		Followed: false,
	})
}

func writeJSON(w http.ResponseWriter, code int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(body)
}
