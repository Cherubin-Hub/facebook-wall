"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";


export default function EditableWallName() {
  const [profileName, setProfileName] = useState("Mark Edward Clemente");
  const [profileId, setProfileId] = useState<string | null>(null);
  const [bio, setBio] = useState<string>("Add a short bio or status...");
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch profile name and bio from Supabase on mount
  useEffect(() => {
    async function fetchProfile() {
      const { data, error } = await supabase
        .from("user_profile")
        .select("id, name, bio")
        .limit(1)
        .single();
      if (!error && data) {
        setProfileName(data.name || "Mark Edward Clemente");
        setProfileId(data.id);
        setBio(data.bio || "Add a short bio or status...");
      }
    }
    fetchProfile();
  }, []);

  const handleEdit = () => {
    setInputValue(profileName);
    setEditing(true);
    setError("");
  };

  const handleCancel = () => {
    setEditing(false);
    setError("");
  };

  const handleSave = async () => {
    if (!inputValue.trim()) {
      setError("Name cannot be empty.");
      return;
    }
    setLoading(true);
    setError("");
    let result;
    if (profileId) {
      result = await supabase
        .from("user_profile")
        .update({ name: inputValue.trim() })
        .eq("id", profileId)
        .select();
    } else {
      result = await supabase
        .from("user_profile")
        .insert([{ name: inputValue.trim() }])
        .select();
    }
    setLoading(false);
    if (result.error) {
      setError("Failed to save. Please try again.");
      return;
    }
    if (result.data && result.data.length > 0) {
      setProfileName(result.data[0].name);
      setProfileId(result.data[0].id);
    } else {
      setProfileName(inputValue.trim());
    }
    setEditing(false);
  };

  return (
    <div className="flex flex-col items-center gap-1 w-full">
      <h2 className="text-2xl font-bold text-gray-900 text-center">
        {editing ? (
          <div className="flex flex-col items-center w-full gap-1">
            <input
              className="text-gray-900 border border-gray-300 rounded px-2 py-1 text-base w-64 text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              maxLength={64}
              disabled={loading}
              autoFocus
            />
            <div className="flex gap-2 mt-1">
              <button
                className="px-2 py-1 rounded bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-60"
                onClick={handleSave}
                disabled={loading}
              >
                Save
              </button>
              <button
                className="px-2 py-1 rounded bg-gray-200 text-gray-800 text-xs font-medium hover:bg-gray-300"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
            {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
          </div>
        ) : (
          <span
            className="cursor-pointer hover:underline"
            title="Click to edit profile name"
            onClick={handleEdit}
          >
            {profileName}
          </span>
        )}
      </h2>
      {/* Editable text below the profile name */}
      <div className="mt-1 w-full flex justify-center">
        <EditableTextBelow
          profileId={profileId}
          bio={bio}
          setBio={setBio}
        />
      </div>
    </div>
  );
// Editable text component below the profile name
function EditableTextBelow({ profileId, bio, setBio }: {
  profileId: string | null;
  bio: string;
  setBio: (bio: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEdit = () => {
    setInputValue(bio === "Add a short bio or status..." ? "" : bio);
    setEditing(true);
    setError("");
  };
  const handleCancel = () => {
    setEditing(false);
    setError("");
  };
  const handleSave = async () => {
    const newBio = inputValue.trim() || "Add a short bio or status...";
    setLoading(true);
    setError("");
    let result;
    if (profileId) {
      result = await supabase
        .from("user_profile")
        .update({ bio: newBio })
        .eq("id", profileId)
        .select();
    } else {
      result = await supabase
        .from("user_profile")
        .insert([{ bio: newBio }])
        .select();
    }
    setLoading(false);
    if (result.error) {
      setError("Failed to save bio. Please try again.");
      return;
    }
    if (result.data && result.data.length > 0) {
      setBio(result.data[0].bio);
    } else {
      setBio(newBio);
    }
    setEditing(false);
  };

  return (
    <div className="w-full flex flex-col items-center">
      {editing ? (
        <div className="flex flex-col items-center w-full gap-1">
          <input
            className="text-gray-900 border border-gray-300 rounded px-2 py-1 text-sm w-64 text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            maxLength={100}
            autoFocus
            disabled={loading}
          />
          <div className="flex gap-2 mt-1">
            <button
              className="px-2 py-1 rounded bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-60"
              onClick={handleSave}
              disabled={loading}
            >
              Save
            </button>
            <button
              className="px-2 py-1 rounded bg-gray-200 text-gray-800 text-xs font-medium hover:bg-gray-300"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </button>
          </div>
          {error && <div className="text-red-500 text-xs mt-1">{error}</div>}
        </div>
      ) : (
        <span
          className={`text-gray-600 text-sm cursor-pointer hover:underline ${bio === "Add a short bio or status..." ? "italic" : ""}`}
          title="Click to edit bio/status"
          onClick={handleEdit}
        >
          {bio}
        </span>
      )}
    </div>
  );
}
}
