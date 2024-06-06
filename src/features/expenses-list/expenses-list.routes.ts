import { Router, Request, Response } from "express";
import status from "http-status";
import { validateResource } from "../../routes/middlewares";
import type { Expense } from "../expenses/expenses.model";
import { UserModel } from "../users/users.model";
import {
  baseExpensesListSchemaNoId,
  paginationSchema,
  queryParamsValidator,
} from "./expenses-list.routes-schema";
import { ExpensesListModel } from "./expenses-list.model";
import { getIO } from "../../socket";
import { AuthRequest } from "../../db/@types";
import { NotificationModel } from "../notifications/notifications.model";

export const router = Router();

router.get(
  "/",
  validateResource(paginationSchema),
  async (req: Request, res: Response) => {
    const offsetNumber = parseInt(req.query.offset as string);
    const limitNumber = parseInt(req.query.limit as string);

    const lists = await ExpensesListModel.find({})
      .populate("creator")
      .populate({
        path: "expenses",
        populate: {
          path: "creator",
          select: "name photo",
        },
      })
      .sort({ createdAt: req.query.sortOrder === "asc" ? 1 : -1 })
      .skip(offsetNumber)
      .limit(limitNumber);

    const listsWithTotal = lists.map((list) => {
      const totalExpenses = list.expenses.reduce(
        (total: number, expense: Expense) => total + expense.price,
        0
      );

      return {
        ...list.toObject(),
        totalExpenses,
      };
    });

    const totalLists = await ExpensesListModel.countDocuments();

    res.status(status.OK).json({
      offset: offsetNumber,
      limit: limitNumber,
      sortOrder: req.query.sortOrder,
      total: totalLists,
      data: listsWithTotal,
    });
  }
);

router.post(
  "/",
  validateResource(baseExpensesListSchemaNoId),
  async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const { name } = authReq.body;
    const creator = authReq.userId;

    if (!name || !creator) {
      return res
        .status(status.BAD_REQUEST)
        .json({ message: "Name and creator are required." });
    }

    const user = await UserModel.findById(creator);

    if (!user) {
      return res.status(status.NOT_FOUND).json({ message: "User not found." });
    }

    const newList = new ExpensesListModel({
      name,
      creator: user._id,
      expenses: [],
      users_ids: [],
    });

    const savedList = await newList.save();

    const io = getIO();

    const notification = new NotificationModel({
      userId: creator,
      type: "list",
      action: "add",
      avatarSrc: user.photo,
      listName: savedList.name,
      timestamp: new Date().toISOString(),
      creatorName: user.name,
    });

    await notification.save();

    io.emit("notification", {
      type: "list",
      props: {
        id: savedList._id.toString(),
        avatarSrc: user.photo,
        listName: savedList.name,
        creatorName: user.name,
        timestamp: new Date().toISOString(),
        action: "add",
      },
    });

    res.status(status.CREATED).json(savedList);
  }
);

router.put(
  "/:id",
  validateResource(baseExpensesListSchemaNoId),
  async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const { id } = req.params;
    const { name } = authReq.body;
    const creator = authReq.userId;

    if (!name || !creator) {
      return res
        .status(status.BAD_REQUEST)
        .json({ message: "Name and creator are required." });
    }

    const user = await UserModel.findById(creator);

    if (!user) {
      return res.status(status.NOT_FOUND).json({ message: "User not found." });
    }

    const updatedList = await ExpensesListModel.findByIdAndUpdate(
      id,
      { name, creator: user._id },
      { new: true, runValidators: true }
    );

    if (!updatedList) {
      return res.status(status.NOT_FOUND).json({ message: "List not found" });
    }

    const io = getIO();

    const notification = new NotificationModel({
      userId: creator,
      type: "list",
      action: "update",
      avatarSrc: user.photo,
      listName: updatedList.name,
      timestamp: new Date().toISOString(),
      creatorName: user.name,
    });

    await notification.save();

    io.emit("notification", {
      type: "list",
      props: {
        id: updatedList._id.toString(),
        avatarSrc: user.photo,
        listName: updatedList.name,
        creatorName: user.name,
        timestamp: new Date().toISOString(),
        action: "update",
      },
    });

    res.status(status.OK).json(updatedList);
  }
);

router.delete(
  "/:id",
  validateResource(queryParamsValidator),
  async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const { id } = req.params;

    const deletedList = await ExpensesListModel.findByIdAndDelete(id);

    if (!deletedList) {
      return res.status(status.NOT_FOUND).json({ message: "List not found" });
    }

    const user = await UserModel.findById(authReq.userId);

    if (!user) {
      return res.status(status.NOT_FOUND).json({ message: "User not found." });
    }

    const io = getIO();

    const notification = new NotificationModel({
      userId: authReq.userId,
      type: "list",
      action: "remove",
      avatarSrc: user.photo,
      listName: deletedList.name,
      timestamp: new Date().toISOString(),
      creatorName: user.name,
    });

    await notification.save();

    io.emit("notification", {
      type: "list",
      props: {
        id: deletedList._id.toString(),
        avatarSrc: user.photo,
        listName: deletedList.name,
        creatorName: user.name,
        timestamp: new Date().toISOString(),
        action: "remove",
      },
    });

    res.status(status.OK).json({ message: "List deleted successfully" });
  }
);

export default ["/api/expenses-list", router] as [string, Router];
