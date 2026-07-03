export function NewsletterForm() {
  return (
    <form className="mx-auto flex max-w-sm items-center gap-2" onSubmit={(e) => e.preventDefault()}>
      <input
        className="h-11 flex-1 rounded-12 border border-neutral-200 bg-white px-4 text-sm outline-none transition-all focus:border-brand-600 focus:shadow-focus"
        placeholder="your@email.com"
        type="email"
      />
      <button
        className="h-11 whitespace-nowrap rounded-12 bg-brand-600 px-5 text-sm font-medium text-white transition-colors hover:bg-brand-700"
        type="submit"
      >
        Subscribe
      </button>
    </form>
  );
}
