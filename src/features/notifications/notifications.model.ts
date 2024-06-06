import mongoose, { Document, Schema } from "mongoose";

export interface Notification extends Document {
  userId: mongoose.Types.ObjectId;
  type: "expense" | "invitation" | "list";
  action: "add" | "update" | "remove";
  avatarSrc: string;
  expenseDescription?: string;
  listName: mongoose.Types.ObjectId; // Changed to ObjectId to use ref
  price?: number;
  timestamp: string;
  creatorName: string;
}

const notificationSchema = new Schema<Notification>({
  userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
  type: {
    type: String,
    enum: ["expense", "invitation", "list"],
    required: true,
  },
  action: { type: String, enum: ["add", "update", "remove"], required: true },
  avatarSrc: { type: String, required: true },
  expenseDescription: { type: String },
  listName: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "ExpensesLists",
  }, // Changed to use ref
  price: { type: Number },
  timestamp: { type: String, required: true },
  creatorName: { type: String, required: true },
});

export const NotificationModel = mongoose.model<Notification>(
  "Notification",
  notificationSchema
);
