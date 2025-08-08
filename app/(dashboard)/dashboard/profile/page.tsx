'use client';

import { useState, useEffect, useRef } from 'react';
import { useRestaurantProfile, ProfileData } from '../../../../lib/hooks/useRestaurantProfile';
import { Toaster } from 'react-hot-toast';
import { LoaderCircle, Building, MapPin, UploadCloud, Copy } from 'lucide-react';
import InputField from '@/app/components/ui/InputField';
import { motion } from 'framer-motion';

export default function ProfilePage() {
  const { profile, isLoading, saveProfile } = useRestaurantProfile();
  
  const [formData, setFormData] = useState<ProfileData>({ name: '', address: '' });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // When profile data loads, populate the form
  useEffect(() => {
    if (profile) {
      setFormData({ name: profile.name, address: profile.address });
      setLogoPreview(profile.logoUrl || null);
    }
  }, [profile]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActionLoading(true);
    await saveProfile(formData, logoFile);
    setIsActionLoading(false);
  };
  
  const handleCopyUrl = () => {
    if (profile?.slug) {
        const url = `${window.location.origin}/${profile.slug}`;
        navigator.clipboard.writeText(url);
        // We can't use toast here because it's defined in the menu page.
        // For a real app, the Toaster component should be in the root layout.
        alert("Public URL copied to clipboard!");
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <LoaderCircle className="w-12 h-12 text-rose-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Restaurant Profile</h1>
        <p className="text-slate-500 mb-8">This information will be displayed publicly on your menu page.</p>

        <div className="bg-white p-8 rounded-lg shadow-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Logo Upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Restaurant Logo</label>
              <div 
                className="w-32 h-32 border-2 border-dashed border-slate-300 rounded-full flex items-center justify-center text-slate-400 cursor-pointer hover:border-rose-500 hover:text-rose-500 transition-colors mx-auto"
                onClick={() => fileInputRef.current?.click()}
              >
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-cover rounded-full"/>
                ) : (
                  <div className="text-center">
                    <UploadCloud className="mx-auto h-8 w-8" />
                    <p className="text-xs mt-1">Upload</p>
                  </div>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleLogoChange}
                className="hidden"
                accept="image/png, image/jpeg"
              />
            </div>
            
            <InputField 
                icon={Building}
                name="name"
                placeholder="Your Restaurant Name"
                value={formData.name}
                onChange={handleChange}
                required
            />
            <InputField 
                icon={MapPin}
                name="address"
                placeholder="Restaurant Address"
                value={formData.address}
                onChange={handleChange}
                required
            />

            <div className="pt-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isActionLoading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:bg-opacity-50 transition"
              >
                {isActionLoading && <LoaderCircle className="w-5 h-5 animate-spin" />}
                {isActionLoading ? 'Saving...' : 'Save Profile'}
              </motion.button>
            </div>
          </form>
        </div>

        {profile?.slug && (
            <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-lg font-semibold text-slate-800">Your Public Menu URL</h2>
                <p className="text-slate-500 text-sm mt-1">Share this link with your customers!</p>
                <div className="mt-4 flex items-center gap-2 p-3 bg-slate-100 rounded-md">
                    <span className="text-rose-600 font-mono flex-grow overflow-x-auto">
                        {`${typeof window !== 'undefined' ? window.location.origin : ''}/${profile.slug}`}
                    </span>
                    <button onClick={handleCopyUrl} className="p-2 text-slate-500 hover:bg-slate-200 rounded-md transition">
                        <Copy className="w-5 h-5"/>
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
