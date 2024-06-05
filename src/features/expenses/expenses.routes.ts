import { Router, Request, Response } from "express";
import status from "http-status";
import { ID, returnNew } from "../../db";
import { validateResource } from "../../routes/middlewares";
import { ExpensesModel, Expense, ExpenseWithListId } from "./expenses.model";
import { ExpensesListModel } from "../expenses-list/expenses-list.model";
import { AuthRequest } from "../../db";
import {
  baseExpensesSchemaNoId,
  expenseIdSchema,
  updateExpensesSchema,
} from "./expenses.routes-schema";
import { getIO } from "../../socket";

export const router = Router();

router.get("/", async (_req, res) => {
  const items = await ExpensesModel.find({}).populate("creator", "name photo");
  res.status(status.OK).json(items);
});

router.post(
  "/",
  validateResource(baseExpensesSchemaNoId),
  async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const { listId, ...expenseData } = authReq.body;
    const creator = authReq.userId;

    if (!creator) {
      return res
        .status(status.UNAUTHORIZED)
        .json({ message: "User not authenticated" });
    }

    const newExpense = await ExpensesModel.create({
      ...expenseData,
      creator,
    });
    await newExpense.populate("creator", "name photo");

    const list = await ExpensesListModel.findById(listId);

    if (listId && list) {
      await ExpensesListModel.findByIdAndUpdate(
        listId,
        { $push: { expenses: newExpense._id } },
        { new: true }
      );

      const io = getIO();
      io.emit("notification", {
        type: "expense",
        props: {
          id: newExpense._id.toString(),
          avatarSrc: newExpense.creator.photo,
          creatorName: newExpense.creator.name,
          expenseDescription: newExpense.name,
          listName: list.name,
          price: newExpense.price,
          timestamp: new Date().toISOString(),
          action: "add",
        },
      });
    }

    res.status(status.CREATED).json(newExpense);
  }
);

router.get(
  "/:id",
  validateResource(expenseIdSchema),
  async (req: Request<ID>, res: Response) => {
    const item = await ExpensesModel.findById(req.params.id).populate(
      "creator",
      "name photo"
    );

    if (!item) {
      return res.sendStatus(status.NOT_FOUND);
    }

    res.status(status.OK).json(item);
  }
);

router.put(
  "/:id",
  validateResource(updateExpensesSchema),
  async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;

    if (!authReq.userId) {
      return res
        .status(status.UNAUTHORIZED)
        .json({ message: "User not authenticated" });
    }

    const updatedExpense = await ExpensesModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      returnNew
    ).populate("creator", "name photo");

    if (!updatedExpense) {
      return res.sendStatus(status.NOT_FOUND);
    }

    const list = await ExpensesListModel.findById(req.body.listId);

    const io = getIO();
    io.emit("notification", {
      type: "expense",
      props: {
        id: updatedExpense._id.toString(),
        avatarSrc: updatedExpense.creator.photo,
        creatorName: updatedExpense.creator.name,
        expenseDescription: updatedExpense.name,
        listName: list ? list.name : req.body.listId,
        price: updatedExpense.price,
        timestamp: new Date().toISOString(),
        action: "update",
      },
    });

    res.status(status.OK).json(updatedExpense);
  }
);

router.delete(
  "/:id",
  validateResource(expenseIdSchema),
  async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const { listId } = authReq.query;

    if (!authReq.userId) {
      return res
        .status(status.UNAUTHORIZED)
        .json({ message: "User not authenticated" });
    }

    const deletedExpense = await ExpensesModel.findByIdAndDelete(
      req.params.id
    ).populate("creator", "name photo");

    if (!deletedExpense) {
      return res.sendStatus(status.NOT_FOUND);
    }

    const list = await ExpensesListModel.findById(listId as string);

    if (listId && list) {
      await ExpensesListModel.findByIdAndUpdate(
        listId as string,
        { $pull: { expenses: req.params.id } },
        { new: true }
      );
    }

    const io = getIO();
    io.emit("notification", {
      type: "expense",
      props: {
        id: deletedExpense._id.toString(),
        avatarSrc: deletedExpense.creator.photo,
        creatorName: deletedExpense.creator.name,
        expenseDescription: deletedExpense.name,
        listName: list ? list.name : (listId as string),
        price: deletedExpense.price,
        timestamp: new Date().toISOString(),
        action: "remove",
      },
    });

    res.status(status.OK).json(deletedExpense);
  }
);

export default ["/api/expenses", router] as [string, Router];
