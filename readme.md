# WebAssembly Image Compressor

This project implements a client-side image compressor using WebAssembly (WASM) with Go. It allows users to compress images directly in their browser without uploading them to a server.

## Features

- Client-side image compression using WebAssembly
- Supports JPEG, PNG, and other image formats (converts unsupported formats to JPEG)
- Adjustable quality and resize parameters
- High-quality image resizing with Catmull-Rom interpolation
- File drag-and-drop interface
- Before/after comparison with size information
- Download compressed images

## Prerequisites

To build this project, you need:

1. Go 1.21 or later with WebAssembly support
2. A modern web browser with WebAssembly support

## Building the Project

1. Clone this repository:
```bash
git clone <repository-url>
cd wasm-image-compressor
```

2. Build the WebAssembly module:
```bash
GOOS=js GOARCH=wasm go build -o image_compressor.wasm main.go
```

3. Copy the required wasm_exec.js file:
```bash
cp "$(go env GOROOT)/lib/wasm/wasm_exec.js" .
```

## Running the Project

Start a local web server:
```bash
python3 -m http.server 8080
```

Then open your browser and navigate to:
```
http://localhost:8080
```

## Project Structure

- `main.go` - Go source code that will be compiled to WebAssembly
- `index.html` - Web interface with JavaScript to interact with the WASM module
- `go.mod` - Go module dependencies
- `image_compressor.wasm` - Compiled WebAssembly binary (generated)
- `wasm_exec.js` - JavaScript support for WebAssembly (copied from Go installation)

## How It Works

1. The browser loads the WebAssembly module compiled from Go code
2. The user selects or drags & drops an image file
3. When the user clicks "Compress Image", the image data is passed to the WASM module
4. The Go code processes the image using pure Go image processing libraries:
   - Detects the image format automatically
   - Resizes the image while maintaining aspect ratio using Catmull-Rom interpolation
   - Compresses the image based on the selected quality settings
   - Preserves the original format when possible, converts to JPEG for unsupported formats
5. The compressed image is returned to JavaScript and displayed for comparison

## Technical Details

The implementation uses:
- Standard Go `image` package for basic image operations
- `image/jpeg` and `image/png` for format-specific encoding
- `golang.org/x/image/draw` for high-quality image resizing
- WebAssembly for client-side processing
- Pure Go implementation for maximum compatibility

## Troubleshooting

If you encounter issues with WebAssembly loading:
- Make sure your browser supports WebAssembly
- Check that you're using a web server (not opening the file directly)
- Look at the browser console for error messages

If there are issues with image processing:
- Ensure you're using a supported image format (JPEG, PNG, etc.)
- Try reducing the image size or quality settings
- Check the browser console for specific error messages

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Go WebAssembly](https://github.com/golang/go/wiki/WebAssembly) - Documentation and examples for Go's WebAssembly support
- [Go Image Package](https://golang.org/pkg/image/) - Standard library image processing
