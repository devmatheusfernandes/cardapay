"use client";

import { useState, useEffect, useRef } from "react";
import {
  useRestaurantProfile,
  ProfileData,
  StripeAccountStatus,
  WorkingHours,
  SocialMedia,
} from "@/lib/hooks/useRestaurantProfile";
import { auth } from "@/lib/firebase";
import {
  LoaderCircle,
  Building,
  MapPin,
  UploadCloud,
  Copy,
  ExternalLink,
  CheckCircle,
  Clock,
  Facebook,
  Instagram,
  Twitter,
  Globe,
  Phone,
  FileText,
  Camera,
  Edit,
  X,
  Save,
  AlertCircle,
  Info,
} from "lucide-react";
import InputField from "@/app/components/ui/InputField";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import QRCodeGenerator from "@/app/components/features/QRCodeGenerator";
import SubscriptionGuard from "@/app/components/guards/SubscriptionGuard";
import PageHeader from "@/app/components/shared/PageHeader";
import OnboardingChecklist from "@/app/components/profile/OnboardingChecklist";
import WelcomeModal from "@/app/components/profile/WelcomeModal";
import ActionButton from "@/app/components/shared/ActionButton";

const defaultWorkingHours: WorkingHours = {
  monday: { open: "09:00", close: "22:00", closed: false },
  tuesday: { open: "09:00", close: "22:00", closed: false },
  wednesday: { open: "09:00", close: "22:00", closed: false },
  thursday: { open: "09:00", close: "22:00", closed: false },
  friday: { open: "09:00", close: "22:00", closed: false },
  saturday: { open: "09:00", close: "22:00", closed: false },
  sunday: { open: "09:00", close: "22:00", closed: false },
};

const dayLabels = {
  monday: "Seg",
  tuesday: "Ter",
  wednesday: "Qua",
  thursday: "Qui",
  friday: "Sex",
  saturday: "Sáb",
  sunday: "Dom",
};

const dayLabelsEdit = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut" as const,
    },
  },
};

export default function ProfilePage() {
  const { profile, stripeStatus, isLoading, saveProfile } =
    useRestaurantProfile();

  const [formData, setFormData] = useState<ProfileData>({
    name: "",
    address: "",
    description: "",
    workingHours: defaultWorkingHours,
    socialMedia: {},
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name,
        address: profile.address,
        description: profile.description || "",
        workingHours: profile.workingHours || defaultWorkingHours,
        socialMedia: profile.socialMedia || {},
      });
      setLogoPreview(profile.logoUrl || null);
      setCoverPreview(profile.coverUrl || null);
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

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSocialMediaChange = (
    platform: keyof SocialMedia,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      socialMedia: {
        ...prev.socialMedia,
        [platform]: value,
      },
    }));
  };

  const handleWorkingHoursChange = (
    day: keyof WorkingHours,
    field: "open" | "close" | "closed",
    value: string | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      workingHours: {
        ...prev.workingHours!,
        [day]: {
          ...prev.workingHours![day],
          [field]: value,
        },
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsActionLoading(true);
    await saveProfile(formData, logoFile, coverFile);
    setIsActionLoading(false);
    setIsEditing(false);
    toast.success("Profile updated successfully!");
  };

  const handleCopyUrl = () => {
    if (profile?.slug) {
      const url = `${window.location.origin}/${profile.slug}`;
      navigator.clipboard.writeText(url);
      toast.success("Public URL copied to clipboard!");
    }
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center h-screen"
      >
        <LoaderCircle className="w-12 h-12 text-emerald-600 animate-spin" />
      </motion.div>
    );
  }

  const publicUrl = profile?.slug
    ? `${window.location.origin}/${profile.slug}`
    : "";

  return (
    <SubscriptionGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6 lg:p-8 pb-24">
        <div className="w-full mx-auto space-y-4">
          <PageHeader
            title="Perfil do Estabelecimento"
            subtitle="Gerencie o perfil público do seu estabelecimento e as configurações."
            actionButton={{
              label: "Editar perfil",
              activeLabel: "Cancelar",
              onClick: toggleEditMode,
              icon: <Edit className="w-4 h-4" />,
              activeIcon: <X className="w-4 h-4" />,
              variant: "primary",
              isActive: isEditing,
            }}
          />

          <AnimatePresence>
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="bg-emerald-50 rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
            >
              <form
                onSubmit={handleSubmit}
                className={isEditing ? "divide-y divide-gray-200" : ""}
              >
                {/* Cover Image Section */}
                <div className="relative group">
                  <div className="relative">
                    <div
                      className={`relative w-full h-48 sm:h-64 ${
                        isEditing
                          ? "border-b-2 border-dashed border-gray-300 hover:border-emerald-500 cursor-pointer"
                          : ""
                      } transition-colors group overflow-hidden`}
                      onClick={() =>
                        isEditing && coverInputRef.current?.click()
                      }
                    >
                      {coverPreview ? (
                        <>
                          <img
                            src={coverPreview}
                            alt="Cover Preview"
                            className="w-full h-full object-cover"
                          />
                          {isEditing && (
                            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="flex items-center gap-2 text-white">
                                <Camera className="w-5 h-5" />
                                <span className="font-medium">Mudar capa</span>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div
                          className={`absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 ${
                            isEditing
                              ? "text-gray-400 group-hover:text-emerald-500"
                              : "text-gray-300"
                          } transition-colors`}
                        >
                          <Camera className="w-8 h-8 sm:w-12 sm:h-12" />
                          {isEditing && (
                            <span className="text-sm mt-2">
                              Upload de imagem de capa
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {isEditing && (
                      <div className="absolute bottom-4 left-4">
                        <p className="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                          Tamanho recomendado: 1200×400px
                        </p>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={coverInputRef}
                    onChange={handleCoverChange}
                    className="hidden"
                    accept="image/png, image/jpeg, image/webp"
                    disabled={!isEditing}
                  />
                </div>

                {/* Profile Section - Logo + Basic Info */}
                <div className="p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row gap-6 items-start">
                    {/* Logo */}
                    <div className="flex-shrink-0">
                      <div
                        className={`relative ${
                          isEditing
                            ? "w-24 h-24 sm:w-32 sm:h-32"
                            : "w-20 h-20 sm:w-24 sm:h-24"
                        } rounded-full border-4 border-white shadow-lg ${
                          isEditing
                            ? "border-dashed border-gray-300 hover:border-emerald-500 cursor-pointer"
                            : "border-white"
                        } transition-colors group -mt-12 sm:-mt-16`}
                        onClick={() =>
                          isEditing && logoInputRef.current?.click()
                        }
                      >
                        {logoPreview ? (
                          <>
                            <img
                              src={logoPreview}
                              alt="Logo Preview"
                              className="w-full h-full object-cover rounded-full"
                            />
                            {isEditing && (
                              <div className="absolute inset-0 bg-black bg-opacity-30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="w-5 h-5 text-white" />
                              </div>
                            )}
                          </>
                        ) : (
                          <div
                            className={`absolute inset-0 flex flex-col items-center justify-center bg-white rounded-full ${
                              isEditing
                                ? "text-gray-400 group-hover:text-emerald-500"
                                : "text-gray-300"
                            } transition-colors`}
                          >
                            <UploadCloud className="w-6 h-6 sm:w-8 sm:h-8" />
                            {isEditing && (
                              <span className="text-xs mt-1">Logo</span>
                            )}
                          </div>
                        )}
                      </div>
                      {isEditing && (
                        <p className="mt-2 text-xs text-gray-500 text-center">
                          256×256px
                        </p>
                      )}
                      <input
                        type="file"
                        ref={logoInputRef}
                        onChange={handleLogoChange}
                        className="hidden"
                        accept="image/png, image/jpeg, image/webp"
                        disabled={!isEditing}
                      />
                    </div>

                    {/* Basic Information */}
                    <div className="flex-1 space-y-4">
                      {isEditing ? (
                        <>
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Building className="w-5 h-5 text-emerald-600" />
                            Informações básicas
                          </h3>
                          <InputField
                            icon={Building}
                            name="name"
                            placeholder="Nome do Estabelecimento"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            disabled={!isEditing}
                          />
                          <InputField
                            icon={MapPin}
                            name="address"
                            placeholder="Endereço"
                            value={formData.address}
                            onChange={handleChange}
                            required
                            disabled={!isEditing}
                          />
                          <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                              <FileText className="w-4 h-4 text-emerald-600" />
                              Descrição
                            </label>
                            <textarea
                              name="description"
                              placeholder="Diga para seus clientes algo sobre seu estabelecimento..."
                              value={formData.description}
                              onChange={handleChange}
                              rows={4}
                              disabled={!isEditing}
                              className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-emerald-500 rounded-lg focus:border-transparent transition-colors resize-none bg-white text-slate-600"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="pt-2">
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                              {formData.name || "Nome do Estabelecimento"}
                            </h1>
                            <div className="flex items-center gap-2 text-gray-600 mb-3">
                              <MapPin className="w-4 h-4" />
                              <span className="text-sm">
                                {formData.address || "Endereço não informado"}
                              </span>
                            </div>
                            {formData.description && (
                              <p className="text-gray-700 text-sm leading-relaxed">
                                {formData.description}
                              </p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Working Hours Section */}
                {isEditing ? (
                  <div className="p-6 sm:p-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-emerald-600" />
                      Horário de funcionamento
                    </h3>
                    <div className="grid gap-4">
                      {Object.entries(dayLabelsEdit).map(([day, label]) => (
                        <motion.div
                          key={day}
                          whileHover={{ scale: 1.01 }}
                          className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center justify-between sm:justify-start sm:min-w-[120px]">
                            <span className="font-medium text-gray-700">
                              {label}
                            </span>
                            <label className="flex items-center gap-2 sm:ml-4">
                              <input
                                type="checkbox"
                                checked={
                                  formData.workingHours![
                                    day as keyof WorkingHours
                                  ].closed
                                }
                                onChange={(e) =>
                                  handleWorkingHoursChange(
                                    day as keyof WorkingHours,
                                    "closed",
                                    e.target.checked
                                  )
                                }
                                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                              />
                              <span className="text-sm text-gray-600">
                                Fechado
                              </span>
                            </label>
                          </div>
                          {!formData.workingHours![day as keyof WorkingHours]
                            .closed && (
                            <div className="flex items-center gap-4 flex-1">
                              <div className="flex items-center gap-2">
                                <input
                                  type="time"
                                  value={
                                    formData.workingHours![
                                      day as keyof WorkingHours
                                    ].open
                                  }
                                  onChange={(e) =>
                                    handleWorkingHoursChange(
                                      day as keyof WorkingHours,
                                      "open",
                                      e.target.value
                                    )
                                  }
                                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                                />
                                <span className="text-gray-500">à</span>
                                <input
                                  type="time"
                                  value={
                                    formData.workingHours![
                                      day as keyof WorkingHours
                                    ].close
                                  }
                                  onChange={(e) =>
                                    handleWorkingHoursChange(
                                      day as keyof WorkingHours,
                                      "close",
                                      e.target.value
                                    )
                                  }
                                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                                />
                              </div>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Compact Working Hours Display */
                  <div className="px-6 sm:px-8 pb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-4 h-4 text-emerald-600" />
                      <span className="font-medium text-gray-900 text-sm">
                        Horário de funcionamento
                      </span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                      {Object.entries(dayLabels).map(([day, label]) => {
                        const dayInfo =
                          formData.workingHours![day as keyof WorkingHours];
                        return (
                          <div
                            key={day}
                            className="text-center p-2 bg-emerald-100 rounded-lg"
                          >
                            <div className="text-xs font-medium text-gray-700 mb-1">
                              {label}
                            </div>
                            {dayInfo.closed ? (
                              <div className="text-xs text-red-600">
                                Fechado
                              </div>
                            ) : (
                              <div className="text-xs text-gray-600">
                                <div>{dayInfo.open}</div>
                                <div>{dayInfo.close}</div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Social Media Section */}
                {isEditing ? (
                  <div className="p-6 sm:p-8 space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Globe className="w-5 h-5 text-emerald-600" />
                      Contato & Redes Sociais
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-6">
                      <InputField
                        icon={Phone}
                        name="phone"
                        placeholder="Número de telefone"
                        value={formData.socialMedia?.phone || ""}
                        onChange={(e) =>
                          handleSocialMediaChange("phone", e.target.value)
                        }
                        disabled={!isEditing}
                      />
                      <InputField
                        icon={Globe}
                        name="website"
                        placeholder="Website URL"
                        value={formData.socialMedia?.website || ""}
                        onChange={(e) =>
                          handleSocialMediaChange("website", e.target.value)
                        }
                        disabled={!isEditing}
                      />
                      <InputField
                        icon={Facebook}
                        name="facebook"
                        placeholder="Facebook URL"
                        value={formData.socialMedia?.facebook || ""}
                        onChange={(e) =>
                          handleSocialMediaChange("facebook", e.target.value)
                        }
                        disabled={!isEditing}
                      />
                      <InputField
                        icon={Instagram}
                        name="instagram"
                        placeholder="Instagram URL"
                        value={formData.socialMedia?.instagram || ""}
                        onChange={(e) =>
                          handleSocialMediaChange("instagram", e.target.value)
                        }
                        disabled={!isEditing}
                      />
                      <InputField
                        icon={Twitter}
                        name="twitter"
                        placeholder="Twitter URL"
                        value={formData.socialMedia?.twitter || ""}
                        onChange={(e) =>
                          handleSocialMediaChange("twitter", e.target.value)
                        }
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                ) : (
                  /* Compact Social Media Display */
                  formData.socialMedia &&
                  Object.keys(formData.socialMedia).some(
                    (key) => formData.socialMedia![key as keyof SocialMedia]
                  ) && (
                    <div className="px-6 sm:px-8 pb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Globe className="w-4 h-4 text-emerald-600" />
                        <span className="font-medium text-gray-900 text-sm">
                          Contato & Redes Sociais
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {formData.socialMedia?.phone && (
                          <a
                            href={`tel:${formData.socialMedia.phone}`}
                            className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm hover:bg-green-100 transition-colors"
                          >
                            <Phone className="w-4 h-4" />
                            <span>{formData.socialMedia.phone}</span>
                          </a>
                        )}
                        {formData.socialMedia?.website && (
                          <a
                            href={formData.socialMedia.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100 transition-colors"
                          >
                            <Globe className="w-4 h-4" />
                            <span>Website</span>
                          </a>
                        )}
                        {formData.socialMedia?.facebook && (
                          <a
                            href={formData.socialMedia.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100 transition-colors"
                          >
                            <Facebook className="w-4 h-4" />
                            <span>Facebook</span>
                          </a>
                        )}
                        {formData.socialMedia?.instagram && (
                          <a
                            href={formData.socialMedia.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 bg-pink-50 text-pink-700 rounded-lg text-sm hover:bg-pink-100 transition-colors"
                          >
                            <Instagram className="w-4 h-4" />
                            <span>Instagram</span>
                          </a>
                        )}
                        {formData.socialMedia?.twitter && (
                          <a
                            href={formData.socialMedia.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm hover:bg-blue-100 transition-colors"
                          >
                            <Twitter className="w-4 h-4" />
                            <span>Twitter</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )
                )}

                {/* Submit Button */}
                {isEditing && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 sm:p-8 bg-gray-50"
                  >
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={isActionLoading}
                      className="w-full sm:w-auto sm:min-w-[200px] flex justify-center items-center gap-2 py-3 px-6 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-purple-600 hover:from-emerald-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-70 transition-colors shadow-lg"
                    >
                      {isActionLoading ? (
                        <LoaderCircle className="w-5 h-5 animate-spin" />
                      ) : (
                        <Save className="w-5 h-5" />
                      )}
                      {isActionLoading ? "Salvando..." : "Salvar"}
                    </motion.button>
                  </motion.div>
                )}
              </form>
            </motion.div>
          </AnimatePresence>

          {/* Onboarding Checklist */}
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
            className="w-full"
          >
            <OnboardingChecklist />
          </motion.div>

          <div className="flex flex-col md:flex-row items-stretch justify-between w-full gap-4">
            {/* Stripe Connect Section */}
            <motion.div
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.2 }}
            >
              <StripeConnectSection stripeStatus={stripeStatus} />
            </motion.div>

            {/* Public URL and QR Code Section */}
            {profile?.slug && (
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.3 }}
                className="bg-emerald-100 w-full rounded-2xl shadow-lg border border-gray-200 p-6 sm:p-8"
              >
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Compartilhe seu cardápio
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Compartilhe o link com seus clientes ou use o QR Code
                    </p>
                  </div>

                  <div className="flex flex-col items-center w-full gap-2">
                    <div className="flex flex-row items-center justify-between w-full p-2 gap-2 bg-emerald-50 rounded-lg border border-gray-200 overflow-x-auto">
                      <span className="text-emerald-600 font-mono text-sm break-all">
                        {publicUrl}
                      </span>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCopyUrl}
                        className="flex-shrink-0 inline-flex items-center justify-center gap-2 py-2 px-2 rounded-lg border border-gray-200 bg-emerald-100 text-teal-700 hover:bg-gray-50 transition-colors shadow-sm"
                      >
                        <Copy className="w-4 h-4" />
                      </motion.button>
                    </div>

                    <QRCodeGenerator url={publicUrl} />
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
      />
    </SubscriptionGuard>
  );
}

const StripeConnectSection = ({
  stripeStatus,
}: {
  stripeStatus: StripeAccountStatus | null;
}) => {
  const [isLoading, setIsLoading] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log("StripeConnectSection - stripeStatus:", stripeStatus);
  }, [stripeStatus]);

  const handleConnect = async () => {
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error("You must be logged in.");
        return;
      }
      const idToken = await user.getIdToken();

      const response = await fetch("/api/stripe-connect/create-account-link", {
        method: "POST",
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (!response.ok) {
        throw new Error("Failed to create connect link.");
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
    if (!stripeStatus || stripeStatus.status === "not_connected") {
      return (
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <ActionButton
            variant="secondary"
            label={isLoading ? "Redirecionando..." : "Conectar com Stripe"}
            icon={
              isLoading ? (
                <LoaderCircle className="w-5 h-5 animate-spin" />
              ) : (
                <ExternalLink className="w-5 h-5" />
              )
            }
            onClick={handleConnect}
            disabled={isLoading}
          />
        </motion.div>
      );
    }

    if (
      stripeStatus.status === "connected" &&
      !stripeStatus.details_submitted
    ) {
      return (
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <ActionButton
            variant="warning"
            label={
              isLoading
                ? "Redirecionando..."
                : "Concluir configuração do Stripe"
            }
            icon={
              isLoading ? (
                <LoaderCircle className="w-5 h-5 animate-spin" />
              ) : (
                <ExternalLink className="w-5 h-5" />
              )
            }
            onClick={handleConnect}
            disabled={isLoading}
          />
        </motion.div>
      );
    }

    if (
      stripeStatus.status === "connected" &&
      stripeStatus.details_submitted &&
      !stripeStatus.payouts_enabled
    ) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="inline-flex items-center gap-2 py-2 px-4 rounded-lg bg-yellow-100 border border-yellow-200 text-yellow-700 font-medium"
        >
          <AlertCircle className="w-5 h-5 text-yellow-500" />
          <span>Conta conectada - Algumas informações pendentes</span>
        </motion.div>
      );
    }

    if (stripeStatus.status === "connected" && stripeStatus.payouts_enabled) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="inline-flex items-center gap-2 py-2 px-4 rounded-lg bg-emerald-200 border border-green-100 text-green-700 font-medium"
        >
          <CheckCircle className="w-5 h-5 text-green-500" />
          <span>Pagamentos conectados</span>
        </motion.div>
      );
    }

    // Handle any other status
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="inline-flex items-center gap-2 py-2 px-4 rounded-lg bg-gray-100 border border-gray-200 text-gray-700 font-medium"
      >
        <Info className="w-5 h-5 text-gray-500" />
        <span>Status: {stripeStatus?.status || "Unknown"}</span>
      </motion.div>
    );
  };

  return (
    <div className="bg-emerald-100 rounded-2xl w-full shadow-lg border border-gray-200 p-6 sm:p-8">
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Configuração de pagamento
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Conecte sua conta Stripe para receber pagamentos diretamente dos
            clientes
          </p>
        </div>
        <div>{renderContent()}</div>
      </div>
    </div>
  );
};
