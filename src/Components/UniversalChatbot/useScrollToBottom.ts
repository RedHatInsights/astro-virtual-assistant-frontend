import { useMessages } from '@redhat-cloud-services/ai-react-state';
import { useEffect, useRef } from 'react';

function useScrollToBottom(isBannerOpen: boolean) {
  const scrollToBottomRef = useRef<HTMLDivElement>(null);
  const messages = useMessages();

  useEffect(() => {
    if (scrollToBottomRef.current && !isBannerOpen) {
      scrollToBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isBannerOpen]);

  return scrollToBottomRef;
}

export default useScrollToBottom;
