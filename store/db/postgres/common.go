package postgres

import "google.golang.org/protobuf/encoding/protojson"

var (
	protojsonUnmarshaler = protojson.UnmarshalOptions{
		DiscardUnknown: true,
	}
)
