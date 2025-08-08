'use client';

import { useState, useEffect, useRef } from 'react';
import { useRestaurantProfile, ProfileData, StripeAccountStatus } from '../../../../lib/hooks/useRestaurantProfile';
import { auth } from '@/lib/firebase';
import { LoaderCircle, Building, MapPin, UploadCloud, Copy, ExternalLink, CheckCircle } from 'lucide-react';
import InputField from '@/app/components/ui/InputField';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import QRCodeGenerator from '@/app/components/features/QRCodeGenerator';
import SubscriptionGuard from '@/app/components/guards/SubscriptionGuard';

export default function ProfilePage() {
  const { profile, stripeStatus, isLoading, saveProfile } = useRestaurantProfile();
  
  const [formData, setFormData] = useState<ProfileData>({ name: '', address: '' });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        toast.success("Public URL copied to clipboard!");
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoaderCircle className="w-12 h-12 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const publicUrl = profile?.slug ? `${window.location.origin}/${profile.slug}` : '';

  return (
    <SubscriptionGuard>
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <header className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Restaurant Profile</h1>
            <p className="text-sm sm:text-base text-gray-500">
              This information will be displayed publicly on your menu page.
            </p>
          </header>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <form onSubmit={handleSubmit} className="divide-y divide-gray-200">
              {/* Logo Section */}
              <div className="p-6 sm:p-8">
                <label className="block text-sm font-medium text-gray-700 mb-4">Restaurant Logo</label>
                <div className="flex flex-col items-center">
                  <div 
                    className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full border-2 border-dashed border-gray-300 hover:border-indigo-500 transition-colors cursor-pointer group"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {logoPreview ? (
                      <img 
                        src={logoPreview} 
                        alt="Logo Preview" 
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 group-hover:text-indigo-500 transition-colors">
                        <UploadCloud className="w-6 h-6 sm:w-8 sm:h-8" />
                        <span className="text-xs mt-1">Upload</span>
                      </div>
                    )}
                  </div>
                  <p className="mt-3 text-xs text-gray-500 text-center">
                    Recommended size: 256×256px
                  </p>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleLogoChange}
                  className="hidden"
                  accept="image/png, image/jpeg, image/webp"
                />
              </div>

              {/* Form Fields */}
              <div className="p-6 sm:p-8 space-y-6">
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
              </div>

              {/* Submit Button */}
              <div className="p-6 sm:p-8 bg-gray-50">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isActionLoading}
                  className="w-full sm:w-auto sm:min-w-[200px] flex justify-center items-center gap-2 py-3 px-6 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 transition-colors shadow-sm"
                >
                  {isActionLoading && <LoaderCircle className="w-5 h-5 animate-spin" />}
                  {isActionLoading ? 'Saving...' : 'Save Profile'}
                </motion.button>
              </div>
            </form>
          </div>

          {/* Stripe Connect Section */}
          <StripeConnectSection stripeStatus={stripeStatus} />

          {/* Public URL Section */}
          {profile?.slug && (
            <div className="space-y-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
                <div className="space-y-4">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Your Public Menu URL</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Share this link with your customers to access your digital menu
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 p-3 bg-gray-50 rounded-lg border border-gray-200 overflow-x-auto">
                      <span className="text-indigo-600 font-mono text-sm break-all">
                        {publicUrl}
                      </span>
                    </div>
                    <button 
                      onClick={handleCopyUrl}
                      className="flex-shrink-0 inline-flex items-center justify-center gap-2 py-3 px-4 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                    >
                      <Copy className="w-5 h-5" />
                      <span className="sr-only sm:not-sr-only">Copy</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* QR Code Section */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">QR Code</h2>
                <div className="flex justify-center">
                  <QRCodeGenerator url={publicUrl} />
                </div>
                <p className="text-sm text-gray-500 mt-4 text-center">
                  Print this QR code for customers to scan and access your menu
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </SubscriptionGuard>
  );
}

const StripeConnectSection = ({ stripeStatus }: { stripeStatus: StripeAccountStatus | null }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
      setIsLoading(true);
      try {
          const user = auth.currentUser;
          if (!user) {
              toast.error("You must be logged in.");
              return;
          }
          const idToken = await user.getIdToken();

          const response = await fetch('/api/stripe-connect/create-account-link', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${idToken}` },
          });

          if (!response.ok) {
              throw new Error('Failed to create connect link.');
          }

          const { url } = await response.json();
          window.location.href = url;
      } catch (error) {
          console.error(error);
          toast.error("Could not connect to Stripe. Please try again.");
          setIsLoading(false);
      }
  };
  
  const renderContent = () => {
      if (!stripeStatus || stripeStatus.status === 'not_connected') {
          return (
              <button 
                  onClick={handleConnect}
                  disabled={isLoading}
                  className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 transition-colors shadow-sm w-full sm:w-auto"
              >
                  {isLoading ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <ExternalLink className="w-5 h-5" />}
                  {isLoading ? 'Redirecting...' : 'Connect with Stripe'}
              </button>
          );
      }

      if (stripeStatus.status === 'connected' && !stripeStatus.details_submitted) {
          return (
              <button 
                  onClick={handleConnect}
                  disabled={isLoading}
                  className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 transition-colors shadow-sm w-full sm:w-auto"
              >
                  {isLoading ? <LoaderCircle className="w-5 h-5 animate-spin" /> : <ExternalLink className="w-5 h-5" />}
                  {isLoading ? 'Redirecting...' : 'Complete Stripe Setup'}
              </button>
          );
      }
      
      if (stripeStatus.status === 'connected' && stripeStatus.payouts_enabled) {
          return (
              <div className="inline-flex items-center gap-2 py-2 px-4 rounded-lg bg-green-50 border border-green-100 text-green-700 font-medium">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Payments Connected</span>
              </div>
          );
      }

      return <p className="text-gray-500">Status checking...</p>;
  };

  return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
          <div className="space-y-4">
              <div>
                  <h2 className="text-lg font-semibold text-gray-900">Payment Setup</h2>
                  <p className="text-sm text-gray-500 mt-1">
                      Connect your Stripe account to receive payments directly from customers
                  </p>
              </div>
              <div>
                  {renderContent()}
              </div>
          </div>
      </div>
  );
};