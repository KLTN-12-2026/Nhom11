import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { ROUTES } from "@/constants/routes";

export const NotFoundPage = () => {
  useDocumentTitle("Page Not Found");

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="font-serif text-6xl italic text-brand-600">404</p>
      <h1 className="mt-4 text-2xl font-semibold text-neutral-900">Page not found</h1>
      <p className="mt-2 text-sm text-neutral-500">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <Link className="mt-6" to={ROUTES.home}>
        <Button variant="primary">Back to home</Button>
      </Link>
    </div>
  );
};
