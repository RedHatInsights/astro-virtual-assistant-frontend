import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from '@patternfly/react-core';
import React from 'react';

const ARHNewChatModal = ({
  isOpen,
  onClose,
  createNewChat,
  parentRef,
}: {
  isOpen: boolean;
  onClose: () => void;
  createNewChat: () => void;
  parentRef: React.RefObject<HTMLDivElement>;
}) => {
  return (
    <Modal appendTo={parentRef.current || document.body} variant="small" title="Start a new chat?" isOpen={isOpen} onClose={onClose}>
      <ModalHeader title="Start a new chat?" labelId="variant-modal-title" titleIconVariant="warning" />
      <ModalBody id="modal-box-body-variant">
        This will close your current conversation and make it view-only. You can still view it later, but you won&apos;t be able to add new messages.
      </ModalBody>
      <ModalFooter>
        <Button key="confirm" variant="link" onClick={createNewChat}>
          Start new chat
        </Button>
        <Button key="cancel" variant="link" onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default ARHNewChatModal;
