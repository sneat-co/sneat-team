module github.com/sneat-co/sneat-team/backend

go 1.25.0

require github.com/sneat-co/sneat-team-ext/backend v0.0.0

// Interim local link to the sibling contract repo (the backend analogue of the
// frontend `link:` dependency). Replace with a tagged version once
// sneat-team-ext publishes releases.
replace github.com/sneat-co/sneat-team-ext/backend => ../../sneat-team-ext/backend
