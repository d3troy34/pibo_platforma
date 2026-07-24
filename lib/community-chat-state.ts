import type { CommunityMessageWithSender } from "@/types/database"

export function appendCommunityMessageUnlessDeleted(
  messages: CommunityMessageWithSender[],
  incoming: CommunityMessageWithSender,
  deletedMessageIds: ReadonlySet<string>
): CommunityMessageWithSender[] {
  if (
    deletedMessageIds.has(incoming.id)
    || messages.some((message) => message.id === incoming.id)
  ) {
    return messages
  }

  return [...messages, incoming]
}
