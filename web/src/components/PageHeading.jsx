export function PageHeading({ title, description }) {
  return (
    <div className="space-y-2">
      <h1 className="max-w-[24ch] text-[2rem] font-semibold leading-[1.12] tracking-[-0.035em] text-foreground sm:text-[2.5rem]">{title}</h1>
      <p className="max-w-[68ch] text-[0.9375rem] leading-6 text-muted-foreground">{description}</p>
    </div>
  )
}
