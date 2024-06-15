
import { Types } from "mongoose";
import { NotificationModel } from "src/features/notifications/notifications.model";
import { getIO } from "src/socket";

interface NotificationProps {
  userId: string;
  type: string;
  action: string;
  listId: Types.ObjectId;
  listName: string;
  creatorName: string;
  avatarSrc: string;
}

export const createNotification = async ({
  userId,
  type,
  action,
  listId,
  listName,
  creatorName,
  avatarSrc,
}: NotificationProps) => {
  const io = getIO();

  const notification = new NotificationModel({
    userId,
    type,
    action,
    avatarSrc,
    listName: listId, // שינוי לשימוש ב-ObjectId
    timestamp: new Date().toISOString(),
    creatorName,
  });

  await notification.save();

  io.emit("notification", {
    type,
    props: {
      id: listId.toString(),
      avatarSrc,
      listName,
      creatorName,
      timestamp: new Date().toISOString(),
      action,
    },
  });
};