.PHONY: all clean serve build-ts debug

# Output files
WASM_FILE = image_compressor.wasm
GO_FILE = main.go
WASM_EXEC_JS = wasm_exec.js
TS_FILES = src/*.ts
JS_OUTPUT = dist

# Build commands
all: $(WASM_FILE) $(WASM_EXEC_JS) build-ts

$(WASM_FILE): $(GO_FILE)
	GOOS=js GOARCH=wasm go build -o $(WASM_FILE) $(GO_FILE)

# Debug build with symbols and no optimization
debug: $(WASM_EXEC_JS)
	@echo "Building debug WASM with symbols..."
	GOOS=js GOARCH=wasm go build -gcflags="all=-N -l" -o $(WASM_FILE) $(GO_FILE)
	@echo "Compiling TypeScript in debug mode..."
	@bun build src/script.ts --outdir dist --target browser --format esm --sourcemap=inline
	@bun build src/ImageComparisonSlider.ts --outdir dist --target browser --format esm --sourcemap=inline
	@echo "Debug build complete!"

$(WASM_EXEC_JS):
	cp "$$(go env GOROOT)/misc/wasm/wasm_exec.js" .

# Build TypeScript files using Bun
build-ts:
	@echo "Compiling TypeScript with Bun..."
	@bun build src/script.ts --outdir dist --target browser --format esm
	@bun build src/ImageComparisonSlider.ts --outdir dist --target browser --format esm

# Clean build files
clean:
	rm -f $(WASM_FILE) $(WASM_EXEC_JS)
	rm -rf $(JS_OUTPUT)

# Serve files for testing (requires Python)
serve:
	python3 -m http.server 8080
