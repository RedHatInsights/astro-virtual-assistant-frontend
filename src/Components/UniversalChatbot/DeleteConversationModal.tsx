import * as React from 'react';
import { Alert, Button, Modal, ModalBody, ModalFooter, ModalHeader, Stack, StackItem } from '@patternfly/react-core';
import { UniversalChatbotContext } from './UniversalChatbotProvider';

type DeleteConversationModalProps = {
  onClose: VoidFunction;
  onDelete: () => Promise<unknown>;
};

const DeleteConversationModal = ({ onClose, onDelete }: DeleteConversationModalProps) => {
  const { rootElementRef } = React.useContext(UniversalChatbotContext);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState<string>();

  const handleDelete = React.useCallback(async () => {
    setError(undefined);
    setIsDeleting(true);
    try {
      await onDelete();
      onClose();
    } catch (e) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError('An error occurred');
      }
    } finally {
      setIsDeleting(false);
    }
  }, [onDelete, onClose]);

  return (
    <Modal
      isOpen
      onClose={isDeleting ? undefined : onClose}
      ouiaId="DeleteConversationModal"
      aria-labelledby="delete-conversation-modal"
      aria-describedby="modal-box-body-delete-conversation"
      variant="small"
      disableFocusTrap
      appendTo={rootElementRef.current || document.body}
    >
      <ModalHeader titleIconVariant="danger" title="Delete conversation?" labelId="delete-conversation-modal" />
      <ModalBody id="modal-box-body-delete-conversation">
        <Stack hasGutter>
          <StackItem>Are you sure you want to delete conversation ?</StackItem>
          {error && (
            <StackItem>
              <Alert isInline variant="danger" title="Failed to delete conversation">
                {error}
              </Alert>
            </StackItem>
          )}
        </Stack>
      </ModalBody>
      <ModalFooter>
        <Button key="confirm" variant="danger" onClick={() => void handleDelete()} isDisabled={isDeleting} isLoading={isDeleting}>
          Delete
        </Button>
        <Button key="cancel" variant="link" onClick={onClose} isDisabled={isDeleting}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default DeleteConversationModal;
