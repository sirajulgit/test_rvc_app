import RNFS from "react-native-fs";
import axios, { AxiosResponse } from "axios";
import { API_ROUTES, FILE_UPLOAD_CHUNK_SIZE } from "../utils/helpers";


interface InitResponse {
    uploadId: string;
}

interface CompleteResponse {
    fileUrl: string;
    name: string;
    mime: string;
}

/** * Type for the optional progress callback function.
 * @param uploadedBytes The number of bytes uploaded so far.
 * @param totalBytes The total size of the file in bytes.
 */
type OnProgressCallback = (uploadedBytes: number, totalBytes: number) => void;

// --- Main Upload Function ---

/**
 * Uploads a file to the server in small, sequential chunks.
 * This avoids memory issues with large files in React Native.
 * * @param fileUri The local URI of the file (e.g., from a document picker).
 * @param name The desired original name of the file.
 * @param size The size of the file in bytes (optional, but recommended).
 * @param mime The MIME type of the file.
 * @param token The user's authentication token.
 * @param onProgress Optional callback to report upload progress.
 * @returns A promise that resolves to the complete file data from the server.
 */
async function uploadFileInChunks(
    fileUri: string,
    name: string,
    size: number,
    mime: string,
    token: string,
    onProgress?: OnProgressCallback
): Promise<CompleteResponse> {

    const authorizationHeader = `Bearer ${token}`;

    // 1. Initialize the Upload
    // The server prepares for the upload and returns a unique uploadId.
    let initRes: AxiosResponse<InitResponse>;
    try {
        initRes = await axios.post<InitResponse>(
            `${API_ROUTES.UPLOAD}/init`,
            { fileName: name, size, mime },
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: authorizationHeader
                }
            }
        );
    } catch (error) {
        console.error("Upload init failed:", error);
        throw new Error("Failed to initialize file upload.");
    }
    const { uploadId } = initRes.data;

    // 2. Determine File Size and Chunking Details
    const path = fileUri.replace("file://", "");
    const fileStat = await RNFS.stat(path);
    const totalSize = size || Number(fileStat.size);
    const totalChunks = Math.ceil(totalSize / FILE_UPLOAD_CHUNK_SIZE);

    let offset = 0;

    // 3. Upload File Chunks Sequentially
    for (let i = 0; i < totalChunks; i++) {
        const length = Math.min(FILE_UPLOAD_CHUNK_SIZE, totalSize - offset);

        // Read the chunk from the file system as base64 string
        const base64Chunk = await RNFS.read(path, length, offset, "base64");

        // Send the chunk to the server
        try {
            await axios.post(
                `${API_ROUTES.UPLOAD}/chunk`,
                { uploadId, index: i, base64Chunk }, // Body
                {
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: authorizationHeader
                    }
                }
            );
        } catch (error) {
            console.error(`Upload of chunk ${i} failed:`, error);
            // NOTE: You might want to implement a retry mechanism here for production.
            throw new Error(`Failed to upload file chunk ${i}.`);
        }

        // Update offset and call the progress callback
        offset += length;
        if (onProgress) {
            onProgress(offset, totalSize);
        }
    }

    // 4. Complete the Upload
    // Notify the server that all chunks have been sent so it can stitch them together.
    let completeRes: AxiosResponse<CompleteResponse>;
    try {
        completeRes = await axios.post<CompleteResponse>(
            `${API_ROUTES.UPLOAD}/complete`,
            { uploadId, totalChunks, originalName: name, mime },
            {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: authorizationHeader
                }
            }
        );
    } catch (error) {
        console.error("Upload complete failed:", error);
        throw new Error("Failed to finalize file upload.");
    }

    // Return the final response from the server
    return completeRes.data;
}

export default { uploadFileInChunks };