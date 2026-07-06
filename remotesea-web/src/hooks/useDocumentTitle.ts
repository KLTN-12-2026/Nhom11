import { useEffect } from "react";

export const useDocumentTitle = (title: string): void => {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${title} | RemoteSEA`;
    return () => {
      document.title = previousTitle;
    };
  }, [title]);
};
