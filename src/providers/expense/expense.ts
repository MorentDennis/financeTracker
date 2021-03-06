import {
  MonthOverView
} from './../../models/MonthOverview';
import {
  DbProvider
} from './../db/db';
import {
  MomentProvider
} from './../moment/moment';
import {
  Account
} from './../../models/Account';
import {
  Expense
} from './../../models/Expense';
import {
  MonthOverviewProvider
} from './../month-overview/month-overview';

import {
  Injectable
} from '@angular/core';

/*
  Generated class for the ExpenseProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class ExpenseProvider {

  constructor(public monthOverviewProvider: MonthOverviewProvider, public momentProvider: MomentProvider, public dbProvider: DbProvider) {}

  public async getExpenses(_id: string, categoryName: string) {
    let monthOverviewObject = await this.monthOverviewProvider.getMonthOverview(_id);
    return monthOverviewObject.getExpensesByCategoryName(categoryName);
  }

  public async deleteExpense(_id: string, expense: Expense) {
    let parsedIntCost = parseInt(expense.getCost()); // bound in model is a string
    let monthOverviewObject = await this.monthOverviewProvider.getMonthOverview(_id);
    let category = monthOverviewObject.getCategoryByName(expense.getCategoryName());
    category.removeExpense(expense);
    category.getBudget().reduceAmountSpentInBudget(parsedIntCost);
    monthOverviewObject.getAccByName(expense.getUsedAccountName()).updateFinalBalance('increase', parsedIntCost);
    if (_id !== this.momentProvider.getCurrentYearAndMonth()) {
      this.updateExpenseCostInFollowingMonths(_id, parsedIntCost, expense.getUsedAccountName(), 'increase', true, true);
    }
    await this.monthOverviewProvider.saveMonthOverview(monthOverviewObject);
  }

  public async addExpense(_id: string, expense: Expense) {
    let parsedIntCost= parseInt(expense.getCost()); // bound in model is a string
    expense.setCost(parsedIntCost);
    let monthOverviewObject = await this.monthOverviewProvider.getMonthOverview(_id);
    let category = monthOverviewObject.getCategoryByName(expense.getCategoryName());
    category.addExpense(expense);
    category.getBudget().addToAmountSpentInBudget(parsedIntCost);
    monthOverviewObject.getAccByName(expense.getUsedAccountName()).updateFinalBalance('decrease', parsedIntCost);
    if (_id !== this.momentProvider.getCurrentYearAndMonth()) {
      this.updateExpenseCostInFollowingMonths(_id, parsedIntCost, expense.getUsedAccountName(), 'decrease', true, true);
    }
    await this.monthOverviewProvider.saveMonthOverview(monthOverviewObject);
  }

  public async updateExpenseCostInFollowingMonths(_id: string, cost: number, accountName: string, operation: string, initial ? : boolean, final ? : boolean) {
    let newDocs: MonthOverView[] = [];
    let allDocs = await this.dbProvider.getDb().allDocs({
      include_docs: true,
      startkey: _id
    });
    allDocs.rows.forEach(mo => {
      let monthOverviewObJect = new MonthOverView(mo.doc._id, mo.doc.accounts, mo.doc.categories, mo.doc._rev, mo.doc.usedTags);
      let account = monthOverviewObJect.getAccByName(accountName);
      if (initial) {
        account.updateInitialBalance(operation, cost);
      }
      if (final) {
        account.updateFinalBalance(operation, cost);
      }

      newDocs.push(monthOverviewObJect);
    });
    await this.dbProvider.getDb().bulkDocs({
      docs: newDocs
    });

  }


}
