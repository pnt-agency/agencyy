"use server";

import { getCurrentUser } from "@/lib/auth";
import {
  listNotificationsForUser,
  markAllNotificationsRead,
  deleteNotification,
} from "@/lib/db/queries";

// The navbar bell is a client component, so rows cross the wire — createdAt is
// serialized to ISO rather than passing a Date through.
export type NotificationItem = {
  id: string;
  body: string;
  href: string | null;
  read: boolean;
  createdAt: string;
};

// Every action here scopes to the caller's own session; none of them takes a
// userId from the client. Signed-out callers get an empty list, not an error —
// the bell renders on public pages too.
export async function getMyNotifications(): Promise<NotificationItem[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const rows = await listNotificationsForUser(user.id);
  return rows.map((row) => ({
    id: row.id,
    body: row.body,
    href: row.href,
    read: row.readAt !== null,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function markAllNotificationsReadAction(): Promise<{ success: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { success: false };

  try {
    await markAllNotificationsRead(user.id);
    return { success: true };
  } catch (error) {
    console.error("Error marking notifications read:", error);
    return { success: false };
  }
}

export async function dismissNotificationAction(id: string): Promise<{ success: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { success: false };

  try {
    await deleteNotification(id, user.id);
    return { success: true };
  } catch (error) {
    console.error("Error dismissing notification:", error);
    return { success: false };
  }
}
