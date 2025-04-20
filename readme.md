# WebAssembly Image Compressor

This project implements a client-side image compressor using WebAssembly (WASM) with Go and the govips library. It allows users to compress images directly in their browser without uploading them to a server.

## Features

- Client-side image compression using WebAssembly
- Supports JPEG, PNG, and WebP image formats
- Adjustable quality and resize parameters
- File drag-and-drop interface
- Before/after comparison with size information
- Download compressed images

## Prerequisites

To build this project, you need:

1. Go 1.20 or later with WebAssembly support
2. libvips installed on your system (for govips)

### Installing libvips

#### On Ubuntu/Debian:
```
sudo apt-get update
sudo apt-get install libvips-dev
```

#### On macOS with Homebrew:
```
brew install vips
```

#### On Windows:
Install vips using the pre-built binaries from [libvips releases](https://github.com/libvips/libvips/releases).

## Building the Project

1. Clone this repository:
```
git clone <repository-url>
cd wasm-image-compressor
```

2. Build the WebAssembly module:
```
make
```

This will:
- Compile the Go code to WebAssembly (`image_compressor.wasm`)
- Copy the required `wasm_exec.js` file from your Go installation

## Running the Project

Start a local web server:
```
make serve
```

Then open your browser and navigate to:
```
http://localhost:8080
```

## Project Structure

- `main.go` - Go source code that will be compiled to WebAssembly
- `index.html` - Web interface with JavaScript to interact with the WASM module
- `go.mod` - Go module dependencies
- `Makefile` - Build automation
- `image_compressor.wasm` - Compiled WebAssembly binary (generated)
- `wasm_exec.js` - JavaScript support for WebAssembly (copied from Go installation)

## How It Works

1. The browser loads the WebAssembly module compiled from Go code
2. The user selects or drags & drops an image file
3. When the user clicks "Compress Image", the image data is passed to the WASM module
4. The Go code uses govips to process the image according to the selected parameters
5. The compressed image is returned to JavaScript and displayed for comparison

## Troubleshooting

If you encounter issues with WebAssembly loading:
- Make sure your browser supports WebAssembly
- Check that you're using a web server (not opening the file directly)
- Look at the browser console for error messages

If there are issues with govips:
- Ensure libvips is properly installed
- Check that your Go environment is properly set up
- Try rebuilding with verbose output: `GOOS=js GOARCH=wasm go build -v -o image_compressor.wasm main.go`

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [govips](https://github.com/davidbyttow/govips) - Go binding for libvips image processing library
- [Go WebAssembly](https://github.com/golang/go/wiki/WebAssembly) - Documentation and examples for Go's WebAssembly support
