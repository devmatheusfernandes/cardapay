import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useClientProfile } from "@/lib/hooks/useClientProfile";
import { MapPin, Check } from "lucide-react";

interface AddressFormProps {
  setDeliveryOption: (isDelivery: boolean, address?: string) => void;
}

export function AddressForm({ setDeliveryOption }: AddressFormProps) {
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [complement, setComplement] = useState("");
  const [useDefaultAddress, setUseDefaultAddress] = useState(false);

  const { profile: clientProfile } = useClientProfile();

  const updateAddressField = useCallback(
    (field: string, value: string) => {
      // If using default address, don't update individual fields
      if (useDefaultAddress) return;

      switch (field) {
        case "street":
          setStreet(value);
          break;
        case "number":
          setNumber(value);
          break;
        case "neighborhood":
          setNeighborhood(value);
          break;
        case "city":
          setCity(value);
          break;
        case "zip":
          setZip(value);
          break;
        case "complement":
          setComplement(value);
          break;
      }

      // Get the current values, using the new value for the field being updated
      const currentStreet = field === "street" ? value : street;
      const currentNumber = field === "number" ? value : number;
      const currentNeighborhood =
        field === "neighborhood" ? value : neighborhood;
      const currentCity = field === "city" ? value : city;
      const currentZip = field === "zip" ? value : zip;
      const currentComplement = field === "complement" ? value : complement;

      // Monta a string formatada para envio
      const formattedAddress = `${currentStreet}, ${currentNumber}${
        currentComplement ? ", " + currentComplement : ""
      }, ${currentNeighborhood}, ${currentCity} - CEP: ${currentZip}`;

      setDeliveryOption(true, formattedAddress);
    },
    [
      street,
      number,
      neighborhood,
      city,
      zip,
      complement,
      setDeliveryOption,
      useDefaultAddress,
    ]
  );

  const handleUseDefaultAddress = useCallback(
    (useDefault: boolean) => {
      setUseDefaultAddress(useDefault);

      if (useDefault && clientProfile?.defaultAddress) {
        setDeliveryOption(true, clientProfile.defaultAddress);
      } else if (!useDefault) {
        // Reset to manual input
        setStreet("");
        setNumber("");
        setNeighborhood("");
        setCity("");
        setZip("");
        setComplement("");
        setDeliveryOption(true, "");
      }
    },
    [clientProfile?.defaultAddress, setDeliveryOption]
  );

  const handleManualAddressChange = useCallback(() => {
    setUseDefaultAddress(false);
    setDeliveryOption(true, "");
  }, [setDeliveryOption]);

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      className="mb-6 space-y-4"
    >
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Endereço de Entrega
      </label>

      {/* Default Address Option */}
      {clientProfile?.defaultAddress && (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => handleUseDefaultAddress(!useDefaultAddress)}
            className={`w-full p-3 rounded-lg border-2 transition-all ${
              useDefaultAddress
                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                : "border-gray-200 bg-white text-gray-700 hover:border-emerald-300"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-medium">Usar endereço padrão</p>
                  <p className="text-sm text-gray-600 truncate">
                    {clientProfile.defaultAddress}
                  </p>
                </div>
              </div>
              {useDefaultAddress && (
                <Check className="w-5 h-5 text-emerald-600" />
              )}
            </div>
          </button>
        </div>
      )}

      {/* Manual Address Form */}
      <div
        className={`space-y-4 ${
          useDefaultAddress ? "opacity-50 pointer-events-none" : ""
        }`}
      >
        {clientProfile?.defaultAddress && (
          <div className="text-center">
            <button
              type="button"
              onClick={handleManualAddressChange}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Ou digite um endereço diferente
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Rua"
            value={street}
            onChange={(e) => updateAddressField("street", e.target.value)}
            className="placeholder:text-slate-800 w-full p-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 transition text-sm"
          />
          <input
            type="text"
            placeholder="Número"
            value={number}
            onChange={(e) => updateAddressField("number", e.target.value)}
            className="placeholder:text-slate-800 w-full p-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 transition text-sm"
          />
          <input
            type="text"
            placeholder="Bairro"
            value={neighborhood}
            onChange={(e) => updateAddressField("neighborhood", e.target.value)}
            className="placeholder:text-slate-800 w-full p-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 transition text-sm"
          />
          <input
            type="text"
            placeholder="Cidade"
            value={city}
            onChange={(e) => updateAddressField("city", e.target.value)}
            className="placeholder:text-slate-800 w-full p-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 transition text-sm"
          />
          <input
            type="text"
            placeholder="CEP"
            value={zip}
            onChange={(e) => updateAddressField("zip", e.target.value)}
            className="placeholder:text-slate-800 w-full p-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 transition text-sm"
          />
          <input
            type="text"
            placeholder="Complemento (opcional)"
            value={complement}
            onChange={(e) => updateAddressField("complement", e.target.value)}
            className="placeholder:text-slate-800 w-full p-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 transition text-sm"
          />
        </div>
      </div>
    </motion.div>
  );
}
