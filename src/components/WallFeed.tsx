"use client";

import { useEffect, useRef, useState } from "react";

// Helper to format time ago
function timeAgo(dateString: string) {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds} seconds ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
}
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";

interface Message {
  id: string;
  name: string;
  text: string;
  image_url?: string;
  created_at: string;
}

// Set your name here
const USER_NAME = "Mark Edward Clemente";

export default function WallFeed() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const textRef = useRef<HTMLTextAreaElement>(null);

  // Delete a message
  async function handleDelete(id: string) {
    if (!window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) return;
    await supabase.from("messages").delete().eq("id", id);
    fetchMessages();
  }

  // Start editing a message
  function startEdit(msg: Message) {
    setEditingId(msg.id);
    setEditText(msg.text);
  }

  // Save edited message
  async function saveEdit(id: string) {
    if (!editText.trim()) return;
    if (!window.confirm("Are you sure you want to update this post?")) return;
    await supabase.from("messages").update({ text: editText.trim() }).eq("id", id);
    setEditingId(null);
    setEditText("");
    fetchMessages();
  }

  // Cancel editing
  function cancelEdit() {
    setEditingId(null);
    setEditText("");
  }

  // Fetch messages from Supabase
  async function fetchMessages() {
    const { data, error } = await supabase
      .from("messages")
      .select("id, name, text, image_url, created_at")
      .order("created_at", { ascending: false });
    if (!error && data) setMessages(data as Message[]);
  }

  useEffect(() => {
    fetchMessages();
    // Optionally, set up a polling interval for live updates
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, []);

  async function handleShare(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    // Show warning before sharing
    const confirmed = window.confirm("Are you sure you want to share this post?");
    if (!confirmed) return;
    // Name is now fixed, no input needed
    if (!text.trim()) {
      setError("Please enter a message.");
      return;
    }
    if (text.length > 280) {
      setError("Message must be 280 characters or less.");
      return;
    }
    setLoading(true);
    let image_url: string | undefined = undefined;
    if (imageFile) {
      // Upload image to Supabase Storage
      const fileExt = imageFile.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
      const { data: storageData, error: storageError } = await supabase.storage
        .from("wall-uploads")
        .upload(fileName, imageFile, { upsert: false });
      if (!storageError) {
        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from("wall-uploads")
          .getPublicUrl(fileName);
        image_url = publicUrlData?.publicUrl;
      }
      // If upload fails, just skip the image (optional)
    }
    // Insert message into Supabase
    const { error: insertError } = await supabase.from("messages").insert([
      {
        name: USER_NAME,
        text: text.trim(),
        image_url,
      },
    ]);
    if (insertError) {
      setError("Failed to post message.");
      setLoading(false);
      return;
    }
    setText("");
    setImageFile(null);
    // Clear the file input value after sharing
    const fileInput = document.querySelector<HTMLInputElement>('input[type="file"]');
    if (fileInput) fileInput.value = "";
    setLoading(false);
    textRef.current?.focus();
    fetchMessages();
  }

  return (
    <section className="w-full max-w-3xl mx-auto flex flex-col items-center gap-8 mt-8">
      <form onSubmit={handleShare} className="w-full flex flex-col gap-4" encType="multipart/form-data">
        <textarea
          ref={textRef}
          className="w-full min-h-[80px] rounded-lg border border-gray-300 dark:border-gray-700 p-4 text-base resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white dark:bg-gray-900 shadow-sm"
          placeholder="What's on your mind? (max 280 chars)"
          value={text}
          onChange={e => setText(e.target.value)}
          maxLength={280}
        />
        <input
          type="file"
          accept="image/*"
          onChange={e => setImageFile(e.target.files?.[0] || null)}
          className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2 bg-white dark:bg-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-400 file:placeholder-gray-400"
          style={{ color: '#9ca3af' }}
        />
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <button
          type="submit"
          className="w-full py-3 rounded-lg bg-primary text-white font-semibold text-lg shadow transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? "Sharing..." : "Share"}
        </button>
      </form>
      <div className="w-full flex flex-col gap-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500">No messages yet. Be the first to post!</div>
        )}
        {messages.map(msg => (
          <div
            key={msg.id}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm flex flex-col gap-4"
          >
            <div className="flex items-center gap-3">
              {/* Removed profile image circle */}
              <span className="font-semibold text-gray-900 dark:text-gray-100 text-base">
                {msg.name}
              </span>
              <span className="ml-auto text-xs text-gray-400">
                {timeAgo(msg.created_at)}
              </span>
            </div>
            {editingId === msg.id ? (
              <>
                <textarea
                  className="w-full min-h-[60px] rounded border border-gray-300 p-2 mt-2"
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  maxLength={280}
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    className="px-3 py-1 rounded bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
                    onClick={e => { e.preventDefault(); saveEdit(msg.id); }}
                    type="button"
                  >
                    Save
                  </button>
                  <button
                    className="px-3 py-1 rounded bg-gray-200 text-gray-800 text-sm font-medium hover:bg-gray-300"
                    onClick={e => { e.preventDefault(); cancelEdit(); }}
                    type="button"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-gray-800 dark:text-gray-200 text-base break-words whitespace-pre-line text-start">
                  {msg.text}
                </div>
                {msg.image_url && (
                  <div className="w-full flex justify-center mt-2 mb-2">
                    <Image
                      src={msg.image_url}
                      alt="Wall post image"
                      width={600}
                      height={400}
                      className="rounded-lg max-h-[400px] object-contain border border-gray-200 dark:border-gray-700"
                    />
                  </div>
                )}
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    className="px-3 py-1 rounded bg-yellow-400 text-gray-900 text-sm font-medium hover:bg-yellow-500"
                    onClick={e => { e.preventDefault(); startEdit(msg); }}
                    type="button"
                  >
                    Edit
                  </button>
                  <button
                    className="px-3 py-1 rounded bg-red-500 text-white text-sm font-medium hover:bg-red-600"
                    onClick={e => { e.preventDefault(); handleDelete(msg.id); }}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      </section>
  );
}
