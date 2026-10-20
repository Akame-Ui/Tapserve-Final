type AdminLogoProps = {
  compact?: boolean
}

export function AdminLogo({ compact = false }: AdminLogoProps) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid grid-cols-3 gap-[3px]" aria-hidden="true">
        {Array.from({ length: 9 }).map((_, index) => (
          <span
            key={index}
            className={
              index === 4
                ? 'h-2.5 w-2.5 rounded-[2px] bg-[#818CF8]'
                : 'h-2.5 w-2.5 rounded-[2px] bg-[#1E293B]'
            }
          />
        ))}
      </div>
      <span className="text-[22px] font-bold tracking-[-0.045em] text-[#1E293B]">
        TapServe
      </span>
      {!compact && (
        <span className="rounded-full bg-[#E0E7FF] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.12em] text-[#4338CA]">
          Admin
        </span>
      )}
    </div>
  )
}
