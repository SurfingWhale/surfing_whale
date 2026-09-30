// app/lib/cloudinary.ts
// Helper untuk upload screenshot ke Cloudinary

import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
    });

    export interface CloudinaryUploadResult {
    secure_url: string;
    public_id: string;
    }

    /**
     * Upload image dari URL (buffer) ke Cloudinary
     * @param imageBuffer - Buffer dari screenshot
     * @param publicId - Nama file di Cloudinary (gunakan project slug)
     */
    export async function uploadToCloudinary(
    imageBuffer: Buffer,
    publicId: string
    ): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
        {
            folder: "surfing-whale/projects",
            public_id: publicId,
            overwrite: true,
            transformation: [
            { width: 1200, height: 630, crop: "fill", gravity: "north" },
            { quality: "auto:good", fetch_format: "auto" },
            ],
        },
        (error, result) => {
            if (error || !result) {
            reject(error ?? new Error("Upload failed"));
            } else {
            resolve({
                secure_url: result.secure_url,
                public_id: result.public_id,
            });
            }
        }
        );
        uploadStream.end(imageBuffer);
    });
    }

    /**
     * Delete image dari Cloudinary by public_id
     */
    export async function deleteFromCloudinary(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId);
    }

/**
 * Photographs, as opposed to project screenshots: nothing is cropped and the
 * stored dimensions come back with the URL, because the gallery needs the
 * aspect ratio to lay a row out before the image has loaded.
 */
export interface CloudinaryPhotoResult extends CloudinaryUploadResult {
    width: number;
    height: number;
}

export async function uploadPhoto(
    imageBuffer: Buffer,
    publicId: string
): Promise<CloudinaryPhotoResult> {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
        {
            folder: "surfing-whale/darkroom",
            public_id: publicId,
            overwrite: false,
            unique_filename: true,
            // Bound the long edge rather than crop; limit never enlarges.
            transformation: [
            { width: 2000, height: 2000, crop: "limit" },
            { quality: "auto:good", fetch_format: "auto" },
            ],
        },
        (error, result) => {
            if (error || !result) {
            reject(error ?? new Error("Upload failed"));
            } else {
            resolve({
                secure_url: result.secure_url,
                public_id: result.public_id,
                width: result.width,
                height: result.height,
            });
            }
        }
        );
        uploadStream.end(imageBuffer);
    });
}

/**
 * The archive, as opposed to an essay's photographs: loose frames that belong
 * to no piece of writing. Same treatment as a darkroom photograph — the long
 * edge is bounded rather than cropped — but a folder and a tag of its own, so
 * the archive can be listed without dragging every essay's images in with it.
 */
export const ARCHIVE_FOLDER = "surfing-whale/archive";
export const ARCHIVE_TAG = "sw-archive";

export async function uploadArchivePhoto(
    imageBuffer: Buffer,
    publicId: string
): Promise<CloudinaryPhotoResult> {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
        {
            folder: ARCHIVE_FOLDER,
            public_id: publicId,
            overwrite: false,
            unique_filename: true,
            tags: [ARCHIVE_TAG],
            transformation: [
            { width: 2400, height: 2400, crop: "limit" },
            { quality: "auto:good", fetch_format: "auto" },
            ],
        },
        (error, result) => {
            if (error || !result) reject(error ?? new Error("Upload failed"));
            else
            resolve({
                secure_url: result.secure_url,
                public_id: result.public_id,
                width: result.width,
                height: result.height,
            });
        }
        );
        uploadStream.end(imageBuffer);
    });
}

export interface ArchiveFrame {
    publicId: string;
    url: string;
    width: number;
    height: number;
    takenAt: string;
}

/**
 * Listed by tag rather than by folder. Cloudinary's folder semantics differ
 * between the fixed and dynamic folder modes an account can be in, and the tag
 * is written by the upload above either way, so this returns the same set
 * regardless of how the account is configured.
 */
export async function listArchivePhotos(limit = 200): Promise<ArchiveFrame[]> {
    if (!process.env.CLOUDINARY_API_SECRET) return [];
    try {
        const res = await cloudinary.search
            .expression(`tags=${ARCHIVE_TAG}`)
            .sort_by("created_at", "desc")
            .max_results(Math.min(limit, 500))
            .execute();
        type Row = {
            public_id: string; secure_url: string;
            width: number; height: number; created_at: string;
        };
        return (res.resources as Row[]).map((r) => ({
            publicId: r.public_id,
            url: r.secure_url,
            width: r.width,
            height: r.height,
            takenAt: r.created_at,
        }));
    } catch (err) {
        // An archive that cannot be listed is an empty archive, not a 500. The
        // rest of the page has nothing to do with Cloudinary.
        console.error("Archive list failed:", err instanceof Error ? err.message : err);
        return [];
    }
}
