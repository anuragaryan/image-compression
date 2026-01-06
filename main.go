package main

import (
	"bytes"
	"fmt"
	"image"
	"image/jpeg"
	"image/png"
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
	if len(args) < 4 {
		return createJSError("Expected 4 arguments: imageData, quality, resize percentage, and algorithm")
	}

	imageData := args[0]
	quality := args[1].Int()
	resizePercent := args[2].Int()
	algorithm := args[3].String()

	// Convert JS Uint8Array to Go []byte
	dataLength := imageData.Length()
	inputData := make([]byte, dataLength)
	js.CopyBytesToGo(inputData, imageData)

	// Process the image
	processedData, err := processImage(inputData, quality, resizePercent, algorithm)
	if err != nil {
		return createJSError(fmt.Sprintf("Image processing failed: %v", err))
	}

	// Return processed image as Uint8Array
	result := js.Global().Get("Uint8Array").New(len(processedData))
	js.CopyBytesToJS(result, processedData)
	return result
}

// processImage compresses and resizes the image
func processImage(inputData []byte, quality int, resizePercent int, algorithm string) ([]byte, error) {
	// Detect image format and decode
	img, format, err := image.Decode(bytes.NewReader(inputData))
	if err != nil {
		return nil, fmt.Errorf("failed to decode image: %w", err)
	}

	// Encode based on original format
	out, err := encodeImage(img, format, quality)

	// Resize and then compress if needed
	if resizePercent < 100 {
		img = resizeImage(img, resizePercent, algorithm)
		resizedImg, err := encodeImage(img, format, quality)

		if len(resizedImg) > len(out) {
			return out, nil
		}

		return resizedImg, err
	}

	return out, err
}

// resizeImage resizes the image while maintaining aspect ratio
func resizeImage(img image.Image, resizePercent int, algorithm string) image.Image {
	// Get original dimensions
	bounds := img.Bounds()
	width := bounds.Dx()
	height := bounds.Dy()

	// Calculate new dimensions
	scale := float64(resizePercent) / 100.0
	newWidth := int(float64(width) * scale)
	newHeight := int(float64(height) * scale)

	// Create new image with new dimensions, preserving the original image type
	// This is important for maintaining PNG compression efficiency
	var dst draw.Image
	switch img.(type) {
	case *image.NRGBA:
		dst = image.NewNRGBA(image.Rect(0, 0, newWidth, newHeight))
	case *image.RGBA:
		dst = image.NewRGBA(image.Rect(0, 0, newWidth, newHeight))
	case *image.Gray:
		dst = image.NewGray(image.Rect(0, 0, newWidth, newHeight))
	case *image.RGBA64:
		dst = image.NewRGBA64(image.Rect(0, 0, newWidth, newHeight))
	case *image.NRGBA64:
		dst = image.NewNRGBA64(image.Rect(0, 0, newWidth, newHeight))
	case *image.Gray16:
		dst = image.NewGray16(image.Rect(0, 0, newWidth, newHeight))
	default:
		// For unknown types, use NRGBA as it compresses better than RGBA
		dst = image.NewNRGBA(image.Rect(0, 0, newWidth, newHeight))
	}

	// Select the scaling algorithm based on user choice
	var scaler draw.Scaler
	switch algorithm {
	case "NearestNeighbor":
		scaler = draw.NearestNeighbor
	case "ApproxBiLinear":
		scaler = draw.ApproxBiLinear
	case "BiLinear":
		scaler = draw.BiLinear
	case "CatmullRom":
		scaler = draw.CatmullRom
	default:
		// Default to BiLinear for high quality
		scaler = draw.BiLinear
	}

	// Apply the selected scaling algorithm
	scaler.Scale(dst, dst.Bounds(), img, bounds, draw.Over, nil)

	return dst
}

// encodeImage encodes the image to bytes with compression
func encodeImage(img image.Image, format string, quality int) ([]byte, error) {
	// Create buffer for output
	var buf bytes.Buffer

	// Encode based on original format
	switch format {
	case "jpeg":
		// JPEG supports lossy compression via quality parameter (1-100)
		if err := jpeg.Encode(&buf, img, &jpeg.Options{Quality: quality}); err != nil {
			return nil, fmt.Errorf("failed to encode JPEG: %w", err)
		}
	case "png":
		// PNG is lossless - use best compression for smallest file size
		// Quality parameter is ignored for PNG
		encoder := png.Encoder{
			CompressionLevel: png.BestCompression,
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

func imageSizeInBytes(img image.Image) int {
	bounds := img.Bounds()
	width := bounds.Dx()
	height := bounds.Dy()

	switch img.(type) {
	case *image.RGBA:
		return width * height * 4 // 4 bytes per pixel (R, G, B, A)
	case *image.NRGBA:
		return width * height * 4 // 4 bytes per pixel
	case *image.Gray:
		return width * height * 1 // 1 byte per pixel
	case *image.Gray16:
		return width * height * 2 // 2 bytes per pixel
	case *image.RGBA64:
		return width * height * 8 // 8 bytes per pixel
	case *image.YCbCr:
		// YCbCr uses different subsampling ratios
		ycbcr := img.(*image.YCbCr)
		return len(ycbcr.Y) + len(ycbcr.Cb) + len(ycbcr.Cr)
	default:
		// Fallback: convert to RGBA and calculate
		return width * height * 4
	}
}

// createJSError converts a Go error to a JavaScript error object
func createJSError(message string) interface{} {
	return js.Global().Get("Error").New(message)
}
