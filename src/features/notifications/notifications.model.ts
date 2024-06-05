import mongoose, { Schema, Document } from "mongoose";
import { Timestamp } from "../../db";

export interface Notification extends Document, Timestamp {
  userId: mongoose.Types.ObjectId;
  message: string;
  read: boolean;
}

const notificationSchema = new Schema<Notification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

export const NotificationModel = mongoose.model<Notification>(
  "Notification",
  notificationSchema
);
