import { FC, ReactNode } from "react";
import Button, { ButtonProps } from "../buttons/Button";
import Dialogue, { DialogueProps } from "./Dialogue";

export type AlertDialogueProps = DialogueProps & {
  headerComponent?: ReactNode;
  headerTitle?: string;
  footerComponent?: ReactNode;
  handleCancel?: () => void;
  handleConfirm?: () => void;
  cancelButtonLabel?: string;
  confirmButtonLabel?: string;
  confirmButtonClassName?: string;
  cancelButtonClassName?: string;
  confirmButtonType?: "button" | "submit" | "reset";
  confirmLoading?: boolean;
  confirmButtonProps?: ButtonProps;
  cancelButtonProps?: ButtonProps;
  modalActionClassName?: string;
  disableConfirmButton?: boolean;
};

const AlertDialogue: FC<AlertDialogueProps> = ({
  children,
  handleCancel,
  handleConfirm,
  cancelButtonLabel = "Cancel",
  confirmButtonLabel = "Confirm",
  confirmButtonClassName = "",
  cancelButtonClassName = "",
  confirmButtonType,
  confirmLoading,
  cancelButtonProps,
  confirmButtonProps,
  modalActionClassName = "",
  disableConfirmButton = false,
  ...props
}) => {
  const hasHeader = props.headerTitle || props.headerComponent;
  const hasActions = !!handleConfirm || !!handleCancel;

  return (
    <Dialogue {...props}>
      {hasHeader && (
        <div className="border-b border-brand-yellow/30 px-6 py-4">
          {props.headerTitle && (
            <h2 className="font-lora text-xl text-brand-yellow">
              {props.headerTitle}
            </h2>
          )}
          {props.headerComponent}
        </div>
      )}

      <div className="overflow-y-auto px-6 py-5">{children}</div>

      {props.footerComponent && (
        <div className="border-t border-brand-yellow/30 px-6 py-4">
          {props.footerComponent}
        </div>
      )}

      {hasActions && (
        <div
          className={`flex gap-3 border-t border-brand-yellow/30 px-6 py-4 ${modalActionClassName}`}
        >
          {handleCancel && (
            <Button
              intent="outline"
              variant="secondary"
              onClick={handleCancel}
              className={cancelButtonClassName}
              {...cancelButtonProps}
            >
              {cancelButtonLabel}
            </Button>
          )}
          {handleConfirm && (
            <Button
              intent="solid"
              variant="primary"
              isLoading={confirmLoading}
              onClick={handleConfirm}
              disabled={disableConfirmButton}
              type={confirmButtonType || "button"}
              className={confirmButtonClassName}
              {...confirmButtonProps}
            >
              {confirmButtonLabel}
            </Button>
          )}
        </div>
      )}
    </Dialogue>
  );
};

export default AlertDialogue;
