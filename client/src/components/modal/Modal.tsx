import { FC } from "react";
import AlertDialogue, { AlertDialogueProps } from "../dialogue/AlertDialogue";

type ModalProps = AlertDialogueProps & {
  isModalOpen?: boolean;
};

const Modal: FC<ModalProps> = ({
  modalBoxClassName = "",
  isModalOpen = true,
  ...props
}) => {
  if (!isModalOpen) return null;

  return (
    <AlertDialogue
      modalBoxClassName={`w-full max-w-lg ${modalBoxClassName}`}
      {...props}
    />
  );
};

export default Modal;
