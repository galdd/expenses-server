import mongoose, { Schema, Document } from "mongoose";
import { Timestamp } from "../../db";

interface Creator {
  _id: mongoose.Types.ObjectId;
  name: string;
  photo: string;
}

export interface Expense extends Document, Timestamp {
  name: string;
  expenseDescription: string;
  price: number;
  date: Date;
  creator: Creator;
}
export interface ExpenseWithListId extends Omit<Expense, "_id"> {
  listId?: string;
}

const expenseSchema = new Schema<Expense>(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    expenseDescription: { type: String, required: false },
    date: { type: Date, required: false },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { versionKey: false, timestamps: true }
);

export const ExpensesModel = mongoose.model<Expense>("Expenses", expenseSchema);
