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

		// Generate a unique file path
		const fileName = `${userId}-${Date.now()}.${fileExt}`;
		const filePath = `${folder}/${fileName}`;

		// Read the file as base64 data
		const base64 = await FileSystem.readAsStringAsync(uri, {
			encoding: FileSystem.EncodingType.Base64,
		});

		// Convert base64 to ArrayBuffer
		const arrayBuffer = decode(base64);

		// Upload to Supabase
		const { data, error } = await supabase.storage
			.from(bucket)
			.upload(filePath, arrayBuffer, {
				contentType: `image/${fileExt}`,
			});

		if (error) throw error;

		// Get public URL
		const { data: publicUrlData } = supabase.storage
			.from(bucket)
			.getPublicUrl(filePath);

		return publicUrlData.publicUrl;
	} catch (error) {
		console.error("Error uploading image:", error);
		throw error;
	}
};

// Export the function as a default object
export default {
	uploadImageToSupabase,
};
