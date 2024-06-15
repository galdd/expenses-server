
import mongoose from "mongoose";
import { ExpensesListModel } from "../../..//expenses-list/expenses-list.model";

export const createList = async (name: string, userId: string) => {
  const newList = new ExpensesListModel({ name, creator: new mongoose.Types.ObjectId(userId) });
  await newList.save();
  return newList;
};