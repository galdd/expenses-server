import { Router, Request, Response } from "express";
import status from "http-status";
import { NotificationModel } from "./notifications.model";
import { AuthRequest } from "../../db";

export const router = Router();

router.get("/", async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const notifications = await NotificationModel.find({
    userId: authReq.userId,
  });
  res.status(status.OK).json(notifications);
});

router.put("/:id/read", async (req: Request, res: Response) => {
  const notification = await NotificationModel.findByIdAndUpdate(
    req.params.id,
    { read: true },
    { new: true }
  );

  if (!notification) {
    return res
      .status(status.NOT_FOUND)
      .json({ message: "Notification not found" });
  }

  res.status(status.OK).json(notification);
});

export default ["/api/notifications", router] as [string, Router];
