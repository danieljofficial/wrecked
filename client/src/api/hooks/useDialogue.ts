import { useId, useState } from "react";
import { flushSync } from "react-dom";
import delay from "../../lib/delay";

const useDialogue = () => {
  const dialogueId = useId();
  const [isDialogueOpen, setIsDialogueOpen] = useState(false);

  const handleUnmountDialogue = () => {
    void (async () => {
      await delay(200);
      setIsDialogueOpen(false);
    })();
  };

  const handleOpenDialogue = () => {
    void (async () => {
      flushSync(() => {
        setIsDialogueOpen(true);
      });
      await delay(100);
      const dialogue = document.getElementById(
        dialogueId,
      ) as HTMLDialogElement | null;
      if (!dialogue) return;
      dialogue.showModal();
    })();
  };

  const handleCloseDialogue = () => {
    const dialogue = document.getElementById(
      dialogueId,
    ) as HTMLDialogElement | null;
    if (!dialogue) return;
    dialogue.close();
    void (async () => {
      await delay(200);
      setIsDialogueOpen(false);
    })();
  };

  return {
    dialogueId,
    handleOpenDialogue,
    handleCloseDialogue,
    handleUnmountDialogue,
    isDialogueOpen,
  };
};

export default useDialogue;
