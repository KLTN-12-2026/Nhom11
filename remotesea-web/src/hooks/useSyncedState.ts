import { useState, type Dispatch, type SetStateAction } from "react";

/**
 * Local, editable copy of a value that resets itself whenever the external
 * value changes underneath it (e.g. a "clear filters" click or browser
 * back/forward) — without needing an effect.
 */
export const useSyncedState = <T>(externalValue: T): [T, Dispatch<SetStateAction<T>>] => {
  const [value, setValue] = useState(externalValue);
  const [synced, setSynced] = useState(externalValue);

  if (!Object.is(externalValue, synced)) {
    setSynced(externalValue);
    setValue(externalValue);
  }

  return [value, setValue];
};
