// Placeholder image for user profile. Replace this file with your own photo (jpg, png, or webp).
import React, { useState } from "react";
// import Image from "next/image";

import { supabase } from "@/lib/supabaseClient";

function ProfilePhoto() {
  // For demo, use a hardcoded user id. Replace with real user id from auth in production.
  // Use a static placeholder image. Replace "/my-photo.jpg" with your own photo file (jpg, png, or webp) in the public/ directory.
  // const profileUrl = "/my-photo.jpg";

  const [postText, setPostText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      console.log('File selected', e.target.files[0]);
    }
  };

  // Handle post submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted');
    let imageUrl = null;
    setUploading(true);
    if (selectedFile) {
      console.log('Selected file:', selectedFile);
      const fileExt = selectedFile.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const { error: storageError } = await supabase.storage
        .from("wall-uploads")
        .upload(fileName, selectedFile, { upsert: false });
      // console.log('Upload result:', { storageData, storageError });
      if (!storageError) {
        const { data: publicUrlData } = supabase.storage
          .from("wall-uploads")
          .getPublicUrl(fileName);
        imageUrl = publicUrlData?.publicUrl;
        console.log('Generated public URL:', imageUrl);
        if (!imageUrl) {
          imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/wall-uploads/${fileName}`;
          console.log('Fallback public URL:', imageUrl);
        }
        setUploadedUrl(imageUrl);
      } else {
        setUploading(false);
        alert("Error uploading image: " + storageError.message);
        return;
      }
    }
    const messageObj = {
      name: "Mark Edward Clemente",
      text: postText.trim(),
      image_url: imageUrl,
    };
    console.log('Inserting message:', messageObj);
    const { error: insertError } = await supabase.from("messages").insert([messageObj]);
    setUploading(false);
    if (insertError) {
      alert("Failed to post message.");
      return;
    }
    setPostText("");
    setSelectedFile(null);
    setUploadedUrl(null);
  };

  return (
    <section className="w-full flex flex-col items-center justify-center py-8">
      <div className="relative flex flex-col items-center">
        {/* Removed profile photo circle */}
        <h1 className="mt-6 text-3xl font-bold text-center tracking-tight text-gray-900 dark:text-gray-100">
          Your Name
        </h1>
      </div>
      {/* Post input section */}
      <form className="w-full max-w-md mt-10 flex flex-col items-center gap-4" onSubmit={handleSubmit}>
        <textarea
          className="w-full min-h-[80px] rounded-lg border border-gray-300 dark:border-gray-700 p-4 text-base resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white dark:bg-gray-900 shadow-sm"
          placeholder="What's on your mind?"
          value={postText}
          onChange={e => setPostText(e.target.value)}
        />
        <input
          type="file"
          accept="image/*"
          className="w-full"
          onChange={handleFileChange}
          disabled={uploading}
        />
        {selectedFile && (
          <div className="w-full flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <span>Selected: {selectedFile.name}</span>
          </div>
        )}
        <button
          type="submit"
          className="w-full py-3 rounded-lg bg-primary text-white font-semibold text-lg shadow transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50"
          disabled={uploading}
        >
          {uploading ? 'Uploading...' : 'Share'}
        </button>
        {uploadedUrl && (
          <div className="w-full text-center text-green-600 dark:text-green-400 text-sm mt-2">
            Image uploaded! <a href={uploadedUrl} target="_blank" rel="noopener noreferrer" className="underline">View</a>
          </div>
        )}
      </form>
    </section>
  );
}

export default ProfilePhoto;

