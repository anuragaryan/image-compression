.PHONY: all clean serve

# Output files
WASM_FILE = image_compressor.wasm
GO_FILE = main.go
WASM_EXEC_JS = wasm_exec.js

# Build commands
all: $(WASM_FILE) $(WASM_EXEC_JS)

$(WASM_FILE): $(GO_FILE)
	GOOS=js GOARCH=wasm go build -o $(WASM_FILE) $(GO_FILE)

$(WASM_EXEC_JS):
	cp "$$(go env GOROOT)/misc/wasm/wasm_exec.js" .

# Clean build files
clean:
	rm -f $(WASM_FILE) $(WASM_EXEC_JS)

# Serve files for testing (requires Python)
serve:
	python3 -m http.server 8080
