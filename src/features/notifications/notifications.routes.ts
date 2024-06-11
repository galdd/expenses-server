import { Router, Request, Response } from "express";
import status from "http-status";
import { AuthRequest } from "../../db/@types";
import { NotificationModel } from "./notifications.model";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const userId = authReq.userId;

  if (!userId) {
    return res
      .status(status.UNAUTHORIZED)
      .json({ message: "User not authenticated" });
  }

  try {
    const notifications = await NotificationModel.find({ userId })
      .populate("listName", "name")
      .sort({ timestamp: -1 })
      .exec();

    const formattedNotifications = notifications.map((notification) => ({
      id: notification._id.toString(),
      type: notification.type,
      action: notification.action,
      avatarSrc: notification.avatarSrc,
      expenseDescription: notification.expenseDescription,
      listName: notification.listName && notification.listName.name ? notification.listName.name : notification.listName,
      price: notification.price,
      timestamp: notification.timestamp,
      creatorName: notification.creatorName,
    }));

    res.status(status.OK).json(formattedNotifications);
  } catch (error) {
    res
      .status(status.INTERNAL_SERVER_ERROR)
      .json({ message: "Error fetching notifications", error });
  }
});

router.post("/clear", async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const userId = authReq.userId;

  if (!userId) {
    return res
      .status(status.UNAUTHORIZED)
      .json({ message: "User not authenticated" });
  }

  try {
    await NotificationModel.deleteMany({ userId }).exec();

    res.status(status.OK).json({ message: "Notifications cleared successfully" });
  } catch (error) {
    res
      .status(status.INTERNAL_SERVER_ERROR)
      .json({ message: "Error clearing notifications", error });
  }
});

export default ["/api/notifications", router] as [string, Router];
