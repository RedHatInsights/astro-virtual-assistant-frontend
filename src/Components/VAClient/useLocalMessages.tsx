import { useState } from 'react';
import { Banner, From, SystemMessage } from '../../types/Message';

type InternalSystemMessage = SystemMessage & { createdAt: number };

export function useSystemMessages() {
  const [systemMessages, setSystemMessages] = useState<InternalSystemMessage[]>([]);
  function addSystemMessage(systemMessageType: string, additionalContent: string[] = []) {
    const message: InternalSystemMessage = {
      from: From.SYSTEM,
      content: 'system_message',
      type: systemMessageType,
      additionalContent,
      createdAt: Date.now(),
    };
    setSystemMessages((prevMessages) => [...prevMessages, message]);
  }
  return { systemMessages, addSystemMessage };
}

type InternalBannerMessage = Banner & { createdAt: number };

export function useBannerMessages() {
  const [bannerMessages, setBannerMessages] = useState<InternalBannerMessage[]>([]);
  function addBanner(bannerType: string, additionalContent: string[] = []) {
    const message: InternalBannerMessage = {
      from: From.INTERFACE,
      content: 'banner',
      type: bannerType,
      additionalContent,
      createdAt: Date.now(),
    };
    setBannerMessages((prevMessages) => [...prevMessages, message]);
  }
  return { bannerMessages, addBanner };
}
