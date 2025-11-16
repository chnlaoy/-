
import * as pdfjsLib from 'pdfjs-dist';
import type { TextItem } from 'pdfjs-dist/types/display/api';
import { ExtractedPdfPage } from '../types';

// Set worker source
if (typeof pdfjsLib.GlobalWorkerOptions.workerSrc !== 'string' || !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    const version = pdfjsLib.version;
    const importMapVersionEntry = "^5.3.31"; 

    if (version) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@${version}/build/pdf.worker.mjs`;
    } else {
        const fallbackVersion = importMapVersionEntry.replace(/[\^~]/g, '');
        console.warn(
            `pdfjsLib.version is not available. Falling back to esm.sh worker version ${fallbackVersion}. ` +
            `This might cause issues if versions mismatch. Ensure 'pdfjs-dist' is correctly loaded.`
        );
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@${fallbackVersion}/build/pdf.worker.mjs`;
    }
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

async function convertImageObjectToDataURL(imageObj: any): Promise<{imageData?: string, imageMimeType?: string} | null> {
    if (!imageObj || !imageObj.width || !imageObj.height) {
        console.warn("Invalid image object received for conversion:", imageObj);
        return null;
    }

    let preferredMimeType = 'image/png'; // Default, can be overridden

    // Handle direct HTMLImageElement, HTMLCanvasElement, ImageBitmap (less common from pdf.objs.get)
    if (imageObj instanceof HTMLImageElement || imageObj instanceof HTMLCanvasElement || imageObj instanceof ImageBitmap) {
        if (imageObj instanceof HTMLImageElement && imageObj.src) {
            if (imageObj.src.startsWith('data:image/jpeg')) preferredMimeType = 'image/jpeg';
            // else if (imageObj.src.startsWith('data:image/png')) preferredMimeType = 'image/png'; // already default
        }
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = (imageObj as any).naturalWidth || imageObj.width;
        tempCanvas.height = (imageObj as any).naturalHeight || imageObj.height;
        const tempCtx = tempCanvas.getContext('2d');
        if (tempCtx) {
            tempCtx.drawImage(imageObj, 0, 0, tempCanvas.width, tempCanvas.height);
            const quality = preferredMimeType === 'image/jpeg' ? 0.9 : undefined;
            const imageData = tempCanvas.toDataURL(preferredMimeType, quality);
            return { imageData, imageMimeType: preferredMimeType };
        }
        return null;
    }

    // Handle raw image data from PDF.js (most common path for page.objs.get)
    if (imageObj.data) {
        const canvas = document.createElement('canvas');
        canvas.width = imageObj.width;
        canvas.height = imageObj.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.warn("Could not get 2D context for image conversion");
            return null;
        }

        const imageDataObj = ctx.createImageData(imageObj.width, imageObj.height);

        if (imageObj.kind === pdfjsLib.ImageKind.JPEG && imageObj.data instanceof Uint8Array) {
            // JPEG data is a stream, convert directly to base64 data URL
            const base64Data = uint8ArrayToBase64(imageObj.data);
            return { imageData: `data:image/jpeg;base64,${base64Data}`, imageMimeType: 'image/jpeg' };
        }
        
        if (imageObj.data instanceof Uint8ClampedArray && imageObj.data.length === imageObj.width * imageObj.height * 4) {
            // Typically RGBA_32BPP
            imageDataObj.data.set(imageObj.data);
            preferredMimeType = 'image/png'; // RGBA best as PNG
        } else if (imageObj.data instanceof Uint8Array) {
            switch (imageObj.kind) {
                case pdfjsLib.ImageKind.GRAYSCALE_1BPP:
                    preferredMimeType = 'image/png';
                    for (let i = 0, j = 0; i < imageDataObj.data.length && j < imageObj.data.length; i += 4, j++) {
                        imageDataObj.data[i] = imageObj.data[j];     // R
                        imageDataObj.data[i+1] = imageObj.data[j]; // G
                        imageDataObj.data[i+2] = imageObj.data[j]; // B
                        imageDataObj.data[i+3] = 255;                // A
                    }
                    break;
                case pdfjsLib.ImageKind.RGB_24BPP:
                    preferredMimeType = 'image/png';
                    for (let i = 0, j = 0; i < imageDataObj.data.length && j < imageObj.data.length; i += 4, j += 3) {
                        imageDataObj.data[i]   = imageObj.data[j];     // R
                        imageDataObj.data[i+1] = imageObj.data[j+1]; // G
                        imageDataObj.data[i+2] = imageObj.data[j+2]; // B
                        imageDataObj.data[i+3] = 255;                 // A (fully opaque)
                    }
                    break;
                case pdfjsLib.ImageKind.RGBA_32BPP: // Should ideally be Uint8ClampedArray, but handle if Uint8Array
                     preferredMimeType = 'image/png';
                     if (imageObj.data.length === imageObj.width * imageObj.height * 4) {
                        imageDataObj.data.set(imageObj.data);
                     } else {
                        console.warn(`RGBA_32BPP (Uint8Array) data length mismatch for page. Expected ${imageObj.width * imageObj.height * 4}, got ${imageObj.data.length}`);
                        return null;
                     }
                    break;
                default:
                    console.warn("Unsupported imageObj.kind in Uint8Array path:", imageObj.kind);
                    return null;
            }
        } else {
            console.warn("Image data is not Uint8ClampedArray (RGBA) or Uint8Array, or length mismatch.", "Kind:", imageObj.kind, "Data type:", typeof imageObj.data);
            return null;
        }

        ctx.putImageData(imageDataObj, 0, 0);
        const quality = preferredMimeType === 'image/jpeg' ? 0.9 : undefined; // Should mostly be PNG here
        const imageData = canvas.toDataURL(preferredMimeType, quality);
        return { imageData, imageMimeType: preferredMimeType };
    }

    console.warn("Image object did not match any known conversion path:", imageObj);
    return null;
}


export async function extractTextAndImagesFromPdf(file: File): Promise<ExtractedPdfPage[]> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  
  try {
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    const extractedPages: ExtractedPdfPage[] = [];

    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .filter((item): item is TextItem => typeof (item as TextItem).str === 'string')
        .map(item => (item as TextItem).str)
        .join(' ');

      let pageImageData: string | undefined;
      let pageImageMimeType: string | undefined;

      try {
        const operatorList = await page.getOperatorList();
        const imageXObjectNames: string[] = [];
        
        // Find image XObjects
        operatorList.fnArray.forEach((fnId, k_fn) => {
            if (fnId === pdfjsLib.OPS.paintImageXObject) { 
                const arg = operatorList.argsArray[k_fn][0];
                if (typeof arg === 'string') { // Ensure arg is a string (name of XObject)
                  imageXObjectNames.push(arg);
                }
            }
        });

        if (imageXObjectNames.length > 0) {
            // For simplicity, using the first image found on the page.
            // A more robust solution might try to find the "best" or largest image.
            const imgName = imageXObjectNames[0]; 
            const imageObj = await page.objs.get(imgName); 

            if (imageObj) {
                // console.log(`Page ${i}, Image Object kind: ${imageObj.kind}, width: ${imageObj.width}, height: ${imageObj.height}, data type: ${imageObj.data?.constructor?.name}`);
                const conversionResult = await convertImageObjectToDataURL(imageObj);
                if (conversionResult) {
                    pageImageData = conversionResult.imageData;
                    pageImageMimeType = conversionResult.imageMimeType;
                    // console.log(`Page ${i}: Successfully converted image. MimeType: ${pageImageMimeType}, Data preview: ${pageImageData?.substring(0,60)}...`);
                } else {
                    // console.warn(`Page ${i}: Failed to convert image object:`, imageObj);
                }
            } else {
                // console.warn(`Page ${i}: Could not retrieve image object for name ${imgName}`);
            }
        }
      } catch (imgError) {
          console.warn(`Could not process images for page ${i}:`, imgError);
      }
      
      extractedPages.push({ 
          pageNumber: i, 
          text: pageText.trim(),
          imageData: pageImageData,
          imageMimeType: pageImageMimeType
      });
      page.cleanup(); // Important to free resources
    }
    return extractedPages;
  } catch (error) {
    console.error("Error parsing PDF:", error);
    if (error instanceof Error) {
        if (error.message.includes("PasswordException") || (error as any).name === 'PasswordException') {
             throw new Error("PDF is password protected and cannot be processed.");
        }
        if (error.message.includes("MissingPDFException") || (error as any).name === 'MissingPDFException') {
            throw new Error("Invalid or corrupted PDF file.");
        }
        if (error.message.includes("Setting up fake worker failed") || error.message.includes("worker")) {
            throw new Error(`Failed to setup PDF processing worker. Worker URL: ${pdfjsLib.GlobalWorkerOptions.workerSrc}. Original error: ${error.message}`);
        }
    }
    throw new Error(`Failed to parse PDF content. ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    if (loadingTask.destroy) { // Ensure loadingTask is cleaned up
        loadingTask.destroy();
    }
  }
}
