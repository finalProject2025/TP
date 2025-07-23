import React from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  canClose?: boolean; // Neue Prop um das Schließen zu kontrollieren
}

function Modal({
  isOpen,
  onClose,
  children,
  title,
  canClose = true,
}: ModalProps) {
  if (!isOpen) return null;

  const handleBackdropClick = () => {
    if (canClose) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(4px)",
      }}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all max-h-[90vh] overflow-y-auto"
        style={{
          animation: "modalSlideIn 0.3s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button - nur anzeigen wenn canClose true ist */}
        {canClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "#f3f4f6",
              border: "none",
              cursor: "pointer",
            }}
            aria-label="Modal schließen"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}

        {/* Header */}
        {title && (
          <div className="text-center pt-4 pb-2">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl" translate="no" >N</span>
              </div>
            </div>
            <h2 id="modal-title" className="text-2xl font-bold text-gray-900">{title}</h2>
          </div>
        )}

        {/* Content */}
        <div className="">{children}</div>
      </div>

      <style>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

export default Modal;
