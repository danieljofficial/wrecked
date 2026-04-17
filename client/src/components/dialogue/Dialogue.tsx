import { FC, ReactEventHandler, ReactNode } from "react";
import ReactDOM from "react-dom";

export type DialogueProps = {
  modalId: string;
  children: ReactNode;
  closeOnClickOutside?: boolean;
  closeOnClickESC?: boolean;
  showCloseIcon?: boolean;
  modalBoxClassName?: string;
  onDismiss?: () => void;
};

const Dialogue: FC<DialogueProps> = ({
  modalId,
  children,
  closeOnClickOutside = false,
  closeOnClickESC = true,
  showCloseIcon = true,
  modalBoxClassName = "",
  onDismiss,
}) => {
  const onCancel: ReactEventHandler<HTMLDialogElement> = (event) => {
    if (!closeOnClickESC) {
      event.preventDefault();
    }
  };

  const modalRoot = document.getElementById("modal");

  return ReactDOM.createPortal(
    <dialog
      id={modalId}
      onCancel={onCancel}
      onClose={onDismiss}
      className="bg-transparent backdrop:bg-brand-black backdrop:bg-opacity-80 backdrop:backdrop-blur-sm"
    >
      <div
        className={`relative flex flex-col border border-brand-yellow bg-[#0E0E0E] text-brand-white ${modalBoxClassName}`}
      >
        {showCloseIcon && (
          <form method="dialog">
            <button
              aria-label="Close"
              type="submit"
              className="absolute right-4 top-4 font-mono text-brand-beige transition-colors hover:text-brand-yellow"
            >
              ✕
            </button>
          </form>
        )}
        {children}
      </div>
      {closeOnClickOutside && (
        <form className="fixed inset-0 -z-10 cursor-default" method="dialog">
          <button type="submit" className="h-full w-full">
            close
          </button>
        </form>
      )}
    </dialog>,
    modalRoot!,
  );
};

export default Dialogue;
