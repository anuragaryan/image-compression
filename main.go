package main

import (
	"bytes"
	"fmt"
	"image"
	"image/jpeg"
	"image/png"
	"math"
	"syscall/js"

	"golang.org/x/image/draw"
)

func main() {
	fmt.Println("Go WebAssembly Image Compressor Initialized")

	// Register functions to JavaScript
	js.Global().Set("compressImageWASM", js.FuncOf(compressImage))

	// Keep the program running
	<-make(chan bool)
}

// compressImage handles the image compression
func compressImage(this js.Value, args []js.Value) interface{} {
	// Extract arguments
	if len(args) < 3 {
		return createJSError("Expected 3 arguments: imageData, quality, and resize percentage")
	}

	imageData := args[0]
	quality := args[1].Int()
	resizePercent := args[2].Int()

	// Convert JS Uint8Array to Go []byte
	dataLength := imageData.Length()
	inputData := make([]byte, dataLength)
	js.CopyBytesToGo(inputData, imageData)

	// Process the image
	processedData, err := processImage(inputData, quality, resizePercent)
	if err != nil {
		return createJSError(fmt.Sprintf("Image processing failed: %v", err))
	}

	// Return processed image as Uint8Array
	result := js.Global().Get("Uint8Array").New(len(processedData))
	js.CopyBytesToJS(result, processedData)
	return result
}

// processImage compresses and resizes the image
func processImage(inputData []byte, quality int, resizePercent int) ([]byte, error) {
	// Detect image format and decode
	img, format, err := image.Decode(bytes.NewReader(inputData))
	if err != nil {
		return nil, fmt.Errorf("failed to decode image: %w", err)
	}

	// Resize if needed
	if resizePercent < 100 {
		img = resizeImage(img, resizePercent)
	}

	// Create buffer for output
	var buf bytes.Buffer

	// Encode based on original format
	switch format {
	case "jpeg":
		if err := jpeg.Encode(&buf, img, &jpeg.Options{Quality: quality}); err != nil {
			return nil, fmt.Errorf("failed to encode JPEG: %w", err)
		}
	case "png":
		encoder := png.Encoder{
			CompressionLevel: png.CompressionLevel(9 - int(math.Round(float64(quality)/100.0*9.0))),
		}
		if err := encoder.Encode(&buf, img); err != nil {
			return nil, fmt.Errorf("failed to encode PNG: %w", err)
		}
	default:
		// For unsupported formats, convert to JPEG
		if err := jpeg.Encode(&buf, img, &jpeg.Options{Quality: quality}); err != nil {
			return nil, fmt.Errorf("failed to encode as JPEG: %w", err)
		}
	}

	return buf.Bytes(), nil
}

// resizeImage resizes the image while maintaining aspect ratio
func resizeImage(img image.Image, resizePercent int) image.Image {
	// Get original dimensions
	bounds := img.Bounds()
	width := bounds.Dx()
	height := bounds.Dy()

	// Calculate new dimensions
	scale := float64(resizePercent) / 100.0
	newWidth := int(float64(width) * scale)
	newHeight := int(float64(height) * scale)

	// Create new image with new dimensions
	dst := image.NewRGBA(image.Rect(0, 0, newWidth, newHeight))

	// Use high-quality resampling
	draw.CatmullRom.Scale(dst, dst.Bounds(), img, bounds, draw.Over, nil)

	return dst
}

// createJSError converts a Go error to a JavaScript error object
func createJSError(message string) interface{} {
	return js.Global().Get("Error").New(message)
}

// Helper function for debugging - logs a value to the JS console
func consoleLog(args ...interface{}) {
	js.Global().Get("console").Call("log", args...)
}
