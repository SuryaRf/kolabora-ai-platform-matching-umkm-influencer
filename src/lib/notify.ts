import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@prisma/client";

export async function notify(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  link?: string,
) {
  try {
    await prisma.notification.create({
      data: { userId, type, title, message, link },
    });
  } catch (error) {
    console.error("Failed to create notification", error);
  }
}
