import React from "react";
import { X } from "lucide-react";
import { useMediaDeviceSelect } from "@livekit/components-react";

interface DeviceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Sub-component for individual device select
const DeviceSelect = ({ kind, label }: { kind: MediaDeviceKind; label: string }) => {
  const { devices, activeDeviceId, setActiveMediaDevice } = useMediaDeviceSelect({ kind });

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-300">{label}</label>
      <select
        value={activeDeviceId}
        onChange={(e) => setActiveMediaDevice(e.target.value)}
        className="w-full bg-[#1e1f22] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        {devices.map((device) => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label || `Thiết bị ${kind} mặc định`}
          </option>
        ))}
      </select>
    </div>
  );
};

const DeviceSettingsModal: React.FC<DeviceSettingsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[#2b2d31] w-full max-w-sm rounded-xl shadow-2xl border border-white/10 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Cài đặt thiết bị</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-5">
          <DeviceSelect kind="audioinput" label="Microphone (Đầu vào âm thanh)" />
          <DeviceSelect kind="audiooutput" label="Loa (Đầu ra âm thanh)" />
          <DeviceSelect kind="videoinput" label="Camera (Đầu vào hình ảnh)" />
        </div>

        {/* Footer */}
        <div className="px-5 py-4 bg-[#1e1f22] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Hoàn tất
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeviceSettingsModal;
