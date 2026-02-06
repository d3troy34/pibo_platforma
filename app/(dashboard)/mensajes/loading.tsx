import { Skeleton } from "@/components/ui/skeleton"

export default function MensajesLoading() {
  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-w-3xl mx-auto">
      <div className="mb-4">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-72 mt-2" />
      </div>
      <div className="flex-1 rounded-t-xl border border-b-0 bg-card/50 p-4 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
            <Skeleton className={`h-16 rounded-lg ${i % 2 === 0 ? "w-2/3" : "w-1/2"}`} />
          </div>
        ))}
      </div>
      <div className="border rounded-b-xl bg-card/50 p-3">
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    </div>
  )
}
