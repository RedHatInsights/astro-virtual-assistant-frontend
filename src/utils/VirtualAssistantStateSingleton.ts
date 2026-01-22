import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { Models } from '../aiClients/types';

// Re-export Models enum and its values for external use
export { Models } from '../aiClients/types';

// Automatically derive ModelValues from Models enum for external use
export const ModelValues = Object.freeze(
  Object.entries(Models).reduce(
    (acc, [key, value]) => ({
      ...acc,
      [key]: value,
    }),
    {} as Record<string, Models>,
  ),
);

export type VirtualAssistantState = {
  isOpen: boolean;
  message?: string;
  currentModel?: Models;
};

const initialState: VirtualAssistantState = {
  isOpen: false,
};

export class VirtualAssistantStateSingleton {
  private static _instance: VirtualAssistantStateSingleton;
  private static _subs: Set<() => void> = new Set<() => void>();
  private static _state: VirtualAssistantState = initialState;

  public static getInstance() {
    if (!VirtualAssistantStateSingleton._instance) {
      VirtualAssistantStateSingleton._instance = new VirtualAssistantStateSingleton();
    }
    return VirtualAssistantStateSingleton._instance;
  }

  // Convenience static methods for external access
  public static setIsOpen(value: boolean) {
    VirtualAssistantStateSingleton.getInstance().isOpen = value;
  }

  public static setMessage(value: string | undefined) {
    VirtualAssistantStateSingleton.getInstance().message = value;
  }

  public static setCurrentModel(value: Models | undefined) {
    VirtualAssistantStateSingleton.getInstance().currentModel = value;
  }

  public static getState() {
    return VirtualAssistantStateSingleton._state;
  }

  subscribe(fn: () => void) {
    VirtualAssistantStateSingleton._subs.add(fn);
    return () => {
      VirtualAssistantStateSingleton._subs.delete(fn);
    };
  }

  notify() {
    VirtualAssistantStateSingleton._subs.forEach((fn) => fn());
  }

  get message() {
    return VirtualAssistantStateSingleton._state.message;
  }

  set message(value: string | undefined) {
    VirtualAssistantStateSingleton._state.message = value;
    this.notify();
  }

  get isOpen() {
    return VirtualAssistantStateSingleton._state.isOpen;
  }

  set isOpen(value: boolean) {
    VirtualAssistantStateSingleton._state.isOpen = value;
    this.notify();
  }

  get currentModel() {
    return VirtualAssistantStateSingleton._state.currentModel;
  }

  set currentModel(value: Models | undefined) {
    VirtualAssistantStateSingleton._state.currentModel = value;
    this.notify();
  }
}

export const useCurrentModel = (): [Models | undefined, Dispatch<SetStateAction<Models | undefined>>] => {
  const [currentModel, setCurrentModelState] = useState(VirtualAssistantStateSingleton.getInstance().currentModel);

  useEffect(() => {
    const unsubscribe = VirtualAssistantStateSingleton.getInstance().subscribe(() => {
      setCurrentModelState(VirtualAssistantStateSingleton.getInstance().currentModel);
    });
    return unsubscribe;
  }, []);

  const setCurrentModel = (value: SetStateAction<Models | undefined>) => {
    const newValue = typeof value === 'function' ? value(VirtualAssistantStateSingleton.getInstance().currentModel) : value;
    VirtualAssistantStateSingleton.getInstance().currentModel = newValue;
  };

  return [currentModel, setCurrentModel];
};

export const useMessage = (): [string | undefined, Dispatch<SetStateAction<string | undefined>>] => {
  const [message, setMessageState] = useState(VirtualAssistantStateSingleton.getInstance().message);

  useEffect(() => {
    const unsubscribe = VirtualAssistantStateSingleton.getInstance().subscribe(() => {
      setMessageState(VirtualAssistantStateSingleton.getInstance().message);
    });
    return unsubscribe;
  }, []);

  const setMessage = (value: SetStateAction<string | undefined>) => {
    const newValue = typeof value === 'function' ? value(VirtualAssistantStateSingleton.getInstance().message) : value;
    VirtualAssistantStateSingleton.getInstance().message = newValue;
  };

  return [message, setMessage];
};

export const useIsOpen = (): [boolean, Dispatch<SetStateAction<boolean>>] => {
  const [isOpen, setIsOpenState] = useState(VirtualAssistantStateSingleton.getInstance().isOpen);

  useEffect(() => {
    const unsubscribe = VirtualAssistantStateSingleton.getInstance().subscribe(() => {
      setIsOpenState(VirtualAssistantStateSingleton.getInstance().isOpen);
    });
    return unsubscribe;
  }, []);

  const setIsOpen = (value: SetStateAction<boolean>) => {
    const newValue = typeof value === 'function' ? value(VirtualAssistantStateSingleton.getInstance().isOpen) : value;
    VirtualAssistantStateSingleton.getInstance().isOpen = newValue;
  };

  return [isOpen, setIsOpen];
};

/**
 * Unified hook for managing all Virtual Assistant state (isOpen, message, currentModel)
 *
 * @returns tupple containing state and setState
 *
 * @example
 * const [state, setState] = useVirtualAssistant();
 *
 * // Open VA with a specific model and message
 * setState({
 *   isOpen: true,
 *   currentModel: Models.RHEL_LIGHTSPEED,
 *   message: 'How do I configure SELinux?'
 * });
 *
 * // Update only specific fields
 * setState({ isOpen: false });
 */
export const useVirtualAssistant = (): [VirtualAssistantState, (updates: Partial<VirtualAssistantState>) => void] => {
  const [state, setStateInternal] = useState<VirtualAssistantState>(VirtualAssistantStateSingleton.getState());

  useEffect(() => {
    const unsubscribe = VirtualAssistantStateSingleton.getInstance().subscribe(() => {
      setStateInternal({ ...VirtualAssistantStateSingleton.getState() });
    });
    return unsubscribe;
  }, []);

  const setState = (updates: SetStateAction<Partial<VirtualAssistantState>>) => {
    const instance = VirtualAssistantStateSingleton.getInstance();

    const newValue = typeof updates === 'function' ? updates(VirtualAssistantStateSingleton.getState()) : updates;

    if ('isOpen' in newValue && newValue.isOpen !== undefined) {
      instance.isOpen = newValue.isOpen;
    }
    if ('message' in newValue) {
      instance.message = newValue.message;
    }
    if ('currentModel' in newValue) {
      instance.currentModel = newValue.currentModel;
    }
  };

  return [state, setState];
};
