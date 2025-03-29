import * as FileSystem from "expo-file-system";
import { supabase } from "./supabase";
import { decode } from "base64-arraybuffer";

/**
 * Uploads an image from a local URI to Supabase Storage
 * Works reliably in React Native environment
 */
export const uploadImageToSupabase = async (
	uri: string,
	bucket: string,
	folder: string,
	userId: string
): Promise<string> => {
	try {
		// Get file extension
		const fileExt = uri.split(".").pop()?.toLowerCase() || "jpg";
		const contentType = `image/${fileExt === "jpg" ? "jpeg" : fileExt}`;

		// Always use Base64 for image data
		const base64 = await FileSystem.readAsStringAsync(uri, {
			encoding: FileSystem.EncodingType.Base64,
		});

		// Create data URL fallback immediately for reliability
		const dataUrl = `data:${contentType};base64,${base64}`;

		// Try upload using user-specific folder path for better organization
		try {
			// Generate a unique file path including the user ID in the path for isolation
			const timestamp = Date.now();
			const fileName = `profile-${timestamp}.${fileExt}`;
			const filePath = `users/${userId}/${fileName}`;

			// Convert base64 to ArrayBuffer for Supabase upload
			const arrayBuffer = decode(base64);

			// Upload to Supabase using anon key
			const { error } = await supabase.storage
				.from(bucket)
				.upload(filePath, arrayBuffer, {
					contentType: contentType,
					upsert: true,
				});

			if (error) {
				// Specific handling based on error code
				if (error.message.includes("new row violates row-level security")) {
					console.log("RLS error, trying public folder...");
					// Fall back to public folder
					const publicPath = `public/${userId}-${timestamp}.${fileExt}`;
					const { error: publicError } = await supabase.storage
						.from(bucket)
						.upload(publicPath, arrayBuffer, {
							contentType: contentType,
							upsert: true,
						});

					if (publicError) {
						console.log("Public folder upload failed too:", publicError);
						throw publicError;
					}

					// Get public URL from the public path
					const { data: publicUrlData } = supabase.storage
						.from(bucket)
						.getPublicUrl(publicPath);

					console.log("Image uploaded to public folder successfully");
					return publicUrlData.publicUrl;
				}

				console.log("Supabase storage upload error:", error);
				throw error;
			}

			// Get public URL
			const { data: publicUrlData } = supabase.storage
				.from(bucket)
				.getPublicUrl(filePath);

			console.log("Image uploaded successfully to user-specific folder");
			return publicUrlData.publicUrl;
		} catch (uploadError) {
			console.log("Falling back to data URL due to upload error:", uploadError);
			return dataUrl;
		}
	} catch (error) {
		console.error("Error in image processing:", error);
		return `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`;
	}
};

/**
 * Deletes old profile images for a given user
 */
export const deleteOldProfileImages = async (
	bucket: string,
	userId: string
): Promise<void> => {
	try {
		// First try to list files in the user's directory
		const { data: userFiles, error: userError } = await supabase.storage
			.from(bucket)
			.list(`users/${userId}`);

		// Then try the public directory
		const { data: publicFiles, error: publicError } = await supabase.storage
			.from(bucket)
			.list("public");

		// Combine files from both locations
		let allUserFiles: any[] = [];

		// Add files from user directory if available
		if (userFiles && !userError) {
			allUserFiles = [
				...userFiles.map((file) => ({
					...file,
					path: `users/${userId}/${file.name}`,
				})),
			];
		}

		// Add files from public directory that belong to this user
		if (publicFiles && !publicError) {
			const userPublicFiles = publicFiles
				.filter((file) => file.name.startsWith(`${userId}-`))
				.map((file) => ({
					...file,
					path: `public/${file.name}`,
				}));

			allUserFiles = [...allUserFiles, ...userPublicFiles];
		}

		// Skip if no files to delete
		if (!allUserFiles || allUserFiles.length <= 1) return;

		// Sort by creation time descending (newest first)
		allUserFiles.sort(
			(a, b) =>
				new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
		);

		// Keep the most recent file, delete the rest
		const filesToDelete = allUserFiles
			.slice(1) // Skip the first (most recent) file
			.map((file) => file.path);

		// Delete old files in batches to avoid errors with too many files
		if (filesToDelete.length > 0) {
			try {
				// Delete in batches of 10
				for (let i = 0; i < filesToDelete.length; i += 10) {
					const batch = filesToDelete.slice(i, i + 10);
					const { error: deleteError } = await supabase.storage
						.from(bucket)
						.remove(batch);

					if (deleteError) {
						console.error(`Error deleting batch ${i}:`, deleteError);
					}
				}
			} catch (deleteError) {
				console.log("Could not delete old files:", deleteError);
			}
		}
	} catch (error) {
		console.error("Error handling old profile images:", error);
		// Don't throw here, just log - this shouldn't block the main flow
	}
};

// Export the function as a default object
export default {
	uploadImageToSupabase,
	deleteOldProfileImages,
};
