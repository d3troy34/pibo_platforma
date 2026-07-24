import type { CommunityMessage, CommunityMessageWithSender } from "@/types/database"

const communityTimestampFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "America/Argentina/Buenos_Aires",
})

/**
 * Postgres Changes and PostgREST do not share a TypeScript boundary with the
 * browser. Normalize their timestamp before putting them into React state,
 * otherwise the date formatter can throw during render and the whole route
 * falls into its error boundary after a successful insert.
 */
export function normalizeCommunityMessage(value: unknown): CommunityMessage | null {
  if (!value || typeof value !== "object") return null

  const message = value as Partial<CommunityMessage>
  if (
    typeof message.id !== "string"
    || typeof message.sender_id !== "string"
    || typeof message.message !== "string"
  ) {
    return null
  }

  const createdAt = typeof message.created_at === "string"
    && !Number.isNaN(new Date(message.created_at).getTime())
    ? message.created_at
    : new Date().toISOString()

  return {
    id: message.id,
    sender_id: message.sender_id,
    message: message.message,
    created_at: createdAt,
  }
}

export function formatCommunityMessageTimestamp(value: unknown): string {
  if (typeof value !== "string") return "Recién enviado"

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Recién enviado"

  return communityTimestampFormatter.format(date)
}

export function appendCommunityMessageUnlessDeleted(
  messages: CommunityMessageWithSender[],
  incoming: unknown,
  deletedMessageIds: ReadonlySet<string>
): CommunityMessageWithSender[] {
  const normalizedIncoming = normalizeCommunityMessage(incoming)
  if (!normalizedIncoming) return messages

  if (
    deletedMessageIds.has(normalizedIncoming.id)
    || messages.some((message) => message.id === normalizedIncoming.id)
  ) {
    return messages
  }

  return [
    ...messages,
    {
      ...(incoming as CommunityMessageWithSender),
      ...normalizedIncoming,
    },
  ]
}
