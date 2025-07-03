import { supabase } from "../lib/supabaseClient";

export async function uploadProfileImage(file: File, userId: string): Promise<string | null> {
  const fileExt = file.name.split('.').pop();
  const filePath = `profile-photos/${userId}.${fileExt}`;
  const { data, error } = await supabase.storage.from("profile-photos").upload(filePath, file, {
    upsert: true,
    contentType: file.type,
  });
  if (error) {
    // Print the full error object for debugging
    console.error("Upload error (full):", JSON.stringify(error, null, 2));
    alert("Upload error: " + (error.message || JSON.stringify(error)));
    return null;
  }
  // Get public URL
  const { data: publicUrlData } = supabase.storage.from("profile-photos").getPublicUrl(filePath);
  return publicUrlData?.publicUrl || null;
}
