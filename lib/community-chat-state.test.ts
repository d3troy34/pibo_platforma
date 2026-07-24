import { describe, expect, it } from "vitest"

import {
  appendCommunityMessageUnlessDeleted,
  formatCommunityMessageTimestamp,
  normalizeCommunityMessage,
} from "./community-chat-state"
import type { CommunityMessageWithSender } from "@/types/database"

function message(id: string): CommunityMessageWithSender {
  return {
    id,
    sender_id: "00000000-0000-0000-0000-000000000001",
    message: "Hola",
    created_at: "2026-07-23T12:00:00.000Z",
    sender: {
      id: "00000000-0000-0000-0000-000000000001",
      full_name: "Student A",
      avatar_url: null,
      role: "student",
    },
  }
}

describe("appendCommunityMessageUnlessDeleted", () => {
  it("does not resurrect a message when its delayed INSERT finishes after DELETE", () => {
    const deletedMessageIds = new Set(["deleted-message"])
    const current = [message("visible-message")]

    expect(
      appendCommunityMessageUnlessDeleted(
        current,
        message("deleted-message"),
        deletedMessageIds
      )
    ).toBe(current)
  })

  it("normalizes a realtime payload without a valid timestamp before it reaches the chat render", () => {
    const current = [message("visible-message")]
    const malformedRealtimePayload = {
      ...message("message-without-a-timestamp"),
      created_at: undefined,
    }

    const normalized = normalizeCommunityMessage(malformedRealtimePayload)
    expect(normalized).not.toBeNull()
    expect(Number.isNaN(new Date(normalized!.created_at).getTime())).toBe(false)

    const next = appendCommunityMessageUnlessDeleted(
      current,
      malformedRealtimePayload,
      new Set<string>()
    )
    expect(next).toHaveLength(2)
    expect(Number.isNaN(new Date(next[1].created_at).getTime())).toBe(false)
    expect(next[1].sender.full_name).toBe("Student A")
  })

  it("uses a safe timestamp label when an unexpected value reaches the UI", () => {
    expect(formatCommunityMessageTimestamp(undefined)).toBe("Recién enviado")
    expect(formatCommunityMessageTimestamp("not-a-date")).toBe("Recién enviado")
  })
})
