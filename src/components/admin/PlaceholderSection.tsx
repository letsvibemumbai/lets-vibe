type Props = {
  title: string;
  description?: string;
};

export function PlaceholderSection({ title, description }: Props) {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="font-display text-4xl text-foreground">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-foreground/55">{description}</p>
        ) : null}
      </header>
      <div className="rounded-3xl border border-dashed border-hairline-strong bg-card p-12 text-center">
        <p className="font-display text-2xl text-foreground">Coming soon</p>
        <p className="mt-2 text-sm text-foreground/55">
          We&rsquo;ll wire this section up next. Auth and the shell are ready.
        </p>
      </div>
    </div>
  );
}
