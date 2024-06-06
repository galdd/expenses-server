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

  const notifications = await NotificationModel.find({ userId })
    .sort({ timestamp: -1 })
    .populate("listName", "name") // Populate listName with the actual name from ExpensesList
    .exec();

  const formattedNotifications = notifications.map((notification) => ({
    type: notification.type,
    props: {
      id: notification._id.toString(),
      avatarSrc: notification.avatarSrc,
      expenseDescription: notification.expenseDescription,
      listName: notification.listName,
      price: notification.price,
      timestamp: notification.timestamp,
      creatorName: notification.creatorName,
      action: notification.action,
    },
  }));

  res.status(status.OK).json(formattedNotifications);
});

export default ["/api/notifications", router] as [string, Router];
