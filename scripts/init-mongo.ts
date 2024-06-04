import * as dotenv from "dotenv";
import mongoose from "mongoose";
import { ExpensesListModel } from "../src/features/expenses-list/expenses-list.model";
import { ExpensesModel } from "../src/features/expenses/expenses.model";
import { UserModel } from "../src/features/users/users.model";
import data from "./mock/expensesListsMock.json";
dotenv.config();

const generateRandomAuth0Id = () => {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
};

const importData = async () => {
  try {
    const mongodbUri = process.env.DBUri as string;
    const auth0Id = process.env.AUTH0_ID || generateRandomAuth0Id(); // USE FOR Quick connection without register
    if (!mongodbUri) {
      throw new Error("MONGODB_URI environment variable is not defined");
    }

    await mongoose.connect(mongodbUri);

    await Promise.all([
      UserModel.deleteMany(),
      ExpensesModel.deleteMany(),
      ExpensesListModel.deleteMany(),
    ]);

    const validLists = data.expensesList.map((list: any) => {
      const createdAt = new Date(list.createdAt);
      const updatedAt = new Date(list.updatedAt);

      return {
        ...list,
        creator: new mongoose.Types.ObjectId(list.creator._id),
        creatorName: list.creator.name,
        creatorPhoto: list.creator.photo,
        createdAt: !isNaN(createdAt.valueOf()) ? createdAt : new Date(),
        updatedAt: !isNaN(updatedAt.valueOf()) ? updatedAt : new Date(),
        expenses: list.expenses.map((expense: any) => {
          const expenseCreatedAt = new Date(expense.createdAt);
          const expenseUpdatedAt = new Date(expense.updatedAt);

          return {
            ...expense,
            _id: new mongoose.Types.ObjectId(expense._id),
            creator: new mongoose.Types.ObjectId(expense.creator._id),
            creatorName: expense.creator.name,
            creatorPhoto: expense.creator.photo,
            createdAt: !isNaN(expenseCreatedAt.valueOf())
              ? expenseCreatedAt
              : new Date(),
            updatedAt: !isNaN(expenseUpdatedAt.valueOf())
              ? expenseUpdatedAt
              : new Date(),
          };
        }),
      };
    });

    const userPromises = validLists.map(async (list) => {
      let creator = await UserModel.findById(list.creator);
      if (!creator) {
        creator = new UserModel({
          _id: list.creator,
          name: list.creatorName,
          photo: list.creatorPhoto,
          auth0Id: auth0Id,
        });
        await creator.save();
      }

      await Promise.all(
        list.expenses.map(async (expense: any) => {
          let expenseCreator = await UserModel.findById(expense.creator);
          if (!expenseCreator) {
            expenseCreator = new UserModel({
              _id: expense.creator,
              name: expense.creatorName,
              photo: expense.creatorPhoto,
              auth0Id: auth0Id,
            });
            await expenseCreator.save();
          }

          await ExpensesModel.updateOne(
            { _id: expense._id },
            {
              ...expense,
              creator: expenseCreator._id,
            },
            { upsert: true }
          );
        })
      );

      await ExpensesListModel.updateOne(
        { _id: list._id },
        {
          ...list,
          creator: creator ? creator._id : null,
          expenses: list.expenses.map((expense: any) => expense._id),
        },
        { upsert: true }
      );
    });

    await Promise.all(userPromises);

    console.log("Data Imported!!");
    process.exit();
  } catch (error) {
    console.error("Error with data import:", error);

    await mongoose.connection.db.dropDatabase();
    console.log("Database dropped due to import error.");

    process.exit(1);
  }
};

importData();
