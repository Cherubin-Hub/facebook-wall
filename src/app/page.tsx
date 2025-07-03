

"use client";

import React from "react";
import { useEffect, useRef } from "react";
import Image from "next/image";
import { uploadProfileImage } from "../lib/profileImage";
import { supabase } from "../lib/supabaseClient";



import WallFeed from "../components/WallFeed";
import EditableWallName from "../components/EditableWallName";

export default function Home() {
  // Profile photo upload functionality
  const [profileImg, setProfileImg] = React.useState<string>("/profile-placeholder.png");
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showInfo, setShowInfo] = React.useState(false);
  const [info, setInfo] = React.useState({
    dob: '',
    gender: '',
    civil: '',
    email: '',
    phone: '',
    city: ''
  });
  const [infoId, setInfoId] = React.useState<string | null>(null);
  const [savedInfo, setSavedInfo] = React.useState<typeof info | null>(null);
  // Load profile image from Supabase storage if exists
  useEffect(() => {
    async function fetchProfileImage() {
      const { data, error } = await supabase.storage.from('profile-photos').list('', { limit: 1 });
      if (!error && data && data.length > 0) {
        // Assume only one profile photo per user, get the first
        const file = data[0];
        const { data: urlData } = supabase.storage.from('profile-photos').getPublicUrl(file.name);
        if (urlData?.publicUrl) {
          setProfileImg(urlData.publicUrl);
        }
      }
    }
    fetchProfileImage();
  }, []);

  // Handle file input change and upload to Supabase Storage
  async function handleProfilePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    // Use a fixed filename for now (e.g., 'profile.jpg')
    const fileExt = file.name.split('.').pop();
    const filePath = `profile.${fileExt}`;
    // Remove previous photo if exists
    await supabase.storage.from('profile-photos').remove([filePath]);
    const { error: uploadError } = await supabase.storage.from('profile-photos').upload(filePath, file, { upsert: true, contentType: file.type });
    if (!uploadError) {
      const { data: urlData } = supabase.storage.from('profile-photos').getPublicUrl(filePath);
      if (urlData?.publicUrl) {
        setProfileImg(urlData.publicUrl + `?t=${Date.now()}`); // bust cache
      }
    } else {
      alert('Failed to upload image.');
    }
    setUploading(false);
  }


  function handleInfoChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setInfo({ ...info, [e.target.name]: e.target.value });
  }

  async function handleInfoSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!window.confirm("Are you sure you want to save this information?")) return;
    // Upsert info to Supabase
    let result;
    if (infoId) {
      result = await supabase.from('user_info').update(info).eq('id', infoId).select();
    } else {
      result = await supabase.from('user_info').insert([info]).select();
    }
    if (!result.error && result.data && result.data.length > 0) {
      setInfoId(result.data[0].id);
      setSavedInfo(info);
    }
    setShowInfo(false);
  }

  // Load info from Supabase on mount
  useEffect(() => {
    async function fetchInfo() {
      const { data, error } = await supabase.from('user_info').select('*').limit(1).single();
      if (!error && data) {
        setInfo({
          dob: data.dob || '',
          gender: data.gender || '',
          civil: data.civil || '',
          email: data.email || '',
          phone: data.phone || '',
          city: data.city || ''
        });
        setInfoId(data.id);
        setSavedInfo({
          dob: data.dob || '',
          gender: data.gender || '',
          civil: data.civil || '',
          email: data.email || '',
          phone: data.phone || '',
          city: data.city || ''
        });
      }
    }
    fetchInfo();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header className="w-full bg-blue-600 text-white py-3 px-6 text-xl font-semibold shadow-sm">
        wall demo
      </header>
      <div className="flex flex-1 w-full max-w-6xl mx-auto mt-8 gap-8">
      {/* Sidebar */}
      <aside className="w-[320px] bg-white rounded-xl shadow p-6 flex flex-col items-center gap-6 border border-gray-200 h-fit sticky top-8">
        {/* Profile photo upload */}
        <div className="flex flex-col items-center gap-2 w-full">
          <div className="relative w-50 h-50 rounded-full overflow-hidden border-4 border-blue-200 bg-gray-100">
            <Image
              src={profileImg}
              alt="Profile Photo"
              fill
              className="object-cover"
              priority
            />
            {uploading && (
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center text-blue-600 font-bold text-lg">Uploading...</div>
            )}
          </div>
          <button
            className="mt-2 px-4 py-1 rounded bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Uploading...' : 'Change Photo'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleProfilePhotoChange}
            disabled={uploading}
          />
        </div>
        <EditableWallName />
        <button
          className="w-full py-2 rounded border border-gray-300 bg-gray-100 text-gray-800 font-medium hover:bg-gray-200 transition"
          onClick={() => setShowInfo(true)}
        >
          Information
        </button>
        <div className="w-full flex flex-col gap-2 mt-2">
          {/* Display personal info only after save */}
          {savedInfo && (savedInfo.dob || savedInfo.gender || savedInfo.civil || savedInfo.email || savedInfo.phone) && (
            <div className="mt-4 border-t pt-4">
              {savedInfo.dob && (
                <div>
                  <span className="text-xs text-gray-500 font-semibold uppercase">Date of Birth: </span>
                  <span className="text-sm text-gray-800 uppercase">{savedInfo.dob}</span>
                </div>
              )}
              {savedInfo.gender && (
                <div>
                  <span className="text-xs text-gray-500 font-semibold uppercase">Gender: </span>
                  <span className="text-sm text-gray-800 uppercase">{savedInfo.gender}</span>
                </div>
              )}
              {savedInfo.civil && (
                <div>
                  <span className="text-xs text-gray-500 font-semibold uppercase">Civil Status: </span>
                  <span className="text-sm text-gray-800 uppercase">{savedInfo.civil}</span>
                </div>
              )}
              {savedInfo.email && (
                <div>
                  <span className="text-xs text-gray-500 font-semibold uppercase">Email: </span>
                  <span className="text-sm text-gray-800 uppercase">{savedInfo.email}</span>
                </div>
              )}
              {savedInfo.phone && (
                <div>
                  <span className="text-xs text-gray-500 font-semibold uppercase">Phone: </span>
                  <span className="text-sm text-gray-800 uppercase">{savedInfo.phone}</span>
                </div>
              )}
              {savedInfo.city && (
                <div>
                  <span className="text-xs text-gray-500 font-semibold uppercase">City: </span>
                  <span className="text-sm text-gray-800 uppercase">{savedInfo.city}</span>
                </div>
              )}
            </div>
          )}
        </div>
        {/* Info Modal */}
        {showInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md relative">
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 text-2xl"
                onClick={() => setShowInfo(false)}
                aria-label="Close"
              >
                &times;
              </button>
              <h2 className="text-xl font-semibold mb-6 text-center">Personal Information</h2>
              <form className="flex flex-col gap-4" onSubmit={handleInfoSubmit}>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Date of Birth</label>
                  <input type="date" name="dob" value={info.dob} onChange={handleInfoChange} className="w-full border rounded px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Gender</label>
                  <select name="gender" value={info.gender} onChange={handleInfoChange} className="w-full border rounded px-3 py-2 text-sm">
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Civil Status</label>
                  <select name="civil" value={info.civil} onChange={handleInfoChange} className="w-full border rounded px-3 py-2 text-sm">
                    <option value="">Select</option>
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="divorced">Divorced</option>
                    <option value="widowed">Widowed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                  <input type="email" name="email" value={info.email} onChange={handleInfoChange} className="w-full border rounded px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number</label>
                  <input type="tel" name="phone" value={info.phone} onChange={handleInfoChange} className="w-full border rounded px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Current City</label>
                  <input type="text" name="city" value={info.city} onChange={handleInfoChange} className="w-full border rounded px-3 py-2 text-sm" />
                </div>
                <button type="submit" className="mt-4 w-full py-2 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition">Save</button>
              </form>
            </div>
          </div>
        )}
      </aside>
        {/* Main content */}
        <main className="flex-1">
          <WallFeed />
        </main>
      </div>
      <footer className="w-full bg-slate-700 mt-12 py-6 border-t border-gray-200 dark:border-gray-700 text-center text-slate-100 text-sm">
        <div className="mb-2">Tools used in this project</div>
        <ul className="flex flex-wrap justify-center gap-4 text-xs text-gray-400">
          <li className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">Next.js 15</li>
          <li className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">React 19</li>
          <li className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">Tailwind CSS</li>
          <li className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">shadcn/ui</li>
          <li className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">Supabase</li>
        </ul>
      </footer>
    </div>
  );
}
