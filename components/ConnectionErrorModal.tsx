import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, ShieldAlert, Globe } from "lucide-react";

interface ConnectionErrorModalProps {
  isOpen: boolean;
  onRetry: () => void;
}

const ConnectionErrorModal: React.FC<ConnectionErrorModalProps> = ({
  isOpen,
  onRetry,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="relative w-full max-w-lg bg-[#0a0a0b] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
          >
            {/* Decorative gradient line at top */}
            <div className="h-1 w-full bg-gradient-to-r from-cyan-500 via-purple-500 to-cyan-500" />

            <div className="p-8 md:p-10">
              <div className="flex flex-col items-center text-center space-y-6">
                {/* Icon Container */}
                <div className="relative">
                  <div className="absolute inset-0 bg-cyan-500/20 blur-xl rounded-full" />
                  <div className="relative p-4 bg-white/5 rounded-full border border-white/10">
                    <WifiOff size={40} className="text-cyan-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-3xl font-bold font-serif text-white">
                    Connection Interrupted
                  </h2>
                  <p className="text-gray-400 text-sm tracking-wide uppercase">
                    API Access Restricted
                  </p>
                </div>

                <div className="bg-white/5 rounded-xl p-6 border border-white/5 w-full text-left space-y-4">
                  <div className="flex gap-4 items-start">
                    <Globe className="text-gray-400 shrink-0 mt-1" size={20} />
                    <div>
                      <h3 className="text-white font-medium mb-1">
                        Regional Restriction Detected
                      </h3>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        Our content provider (TMDB) may be unavailable in your
                        current region. This is a known issue with certain ISPs.
                      </p>
                    </div>
                  </div>

                  <div className="h-px w-full bg-white/10" />

                  <div className="flex gap-4 items-start">
                    <ShieldAlert
                      className="text-gray-400 shrink-0 mt-1"
                      size={20}
                    />
                    <div>
                      <h3 className="text-white font-medium mb-1">
                        Recommended Solution
                      </h3>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        We recommend enabling a VPN (like{" "}
                        <span className="text-cyan-400 font-medium">
                          Cloudflare WARP
                        </span>
                        ) or using a valid proxy to restore access.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={onRetry}
                  className="w-full py-4 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-bold rounded-xl transition-all shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 active:scale-[0.98]"
                >
                  Retry Connection
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConnectionErrorModal;
