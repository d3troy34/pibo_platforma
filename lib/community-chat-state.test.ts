import { describe, expect, it } from "vitest"

import { appendCommunityMessageUnlessDeleted } from "./community-chat-state"
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
})
