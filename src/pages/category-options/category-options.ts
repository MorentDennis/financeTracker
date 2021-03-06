import { CategoryProvider } from './../../providers/category/category';
import { MomentProvider } from './../../providers/moment/moment';
import { BudgetProvider } from './../../providers/budget/budget';
import {
  IconsPage
} from './../icons/icons';
import {
  ColorPickerPage
} from './../color-picker/color-picker';
import {
  Budget
} from './../../models/Budget';
import {
  Category
} from './../../models/Category';
import {
  Component
} from '@angular/core';
import {
  IonicPage,
  NavController,
  NavParams,
  AlertController,
  PopoverController
} from 'ionic-angular';

/**
 * Generated class for the CategoryOptionsPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */


@Component({
  selector: 'page-category-options',
  templateUrl: 'category-options.html',
})
export class CategoryOptionsPage {
  public category: Category;
  public budget: Budget;
  public selectedColor: string;
  public selectedIcon: string;
  public currentDate_ISO_8601: string;
  public selectedYearAndMonth: string;

  constructor(public navCtrl: NavController, public navParams: NavParams, public alertCtrl: AlertController, public popoverCtrl: PopoverController, public budgetProvider: BudgetProvider, public momentProvider: MomentProvider, public categoryProvider: CategoryProvider) {
    this.category = this.navParams.get("category")
    this.selectedYearAndMonth = this.momentProvider.getSelectedYearAndMonth();
    this.budget = this.category.getBudget();
    this.currentDate_ISO_8601 = this.momentProvider.getCurrentDate_ISO_8601();
    this.selectedColor = this.category.getCategoryColor();
    this.selectedIcon = this.category.getIconName();
    
  }

  async ionViewWillEnter(){
    
  }

  isInThePast(){
    return (this.momentProvider.getFormattedDateInYearAndMonth(this.currentDate_ISO_8601) !== this.selectedYearAndMonth)
  }

  addNewBudget() {
    const prompt = this.alertCtrl.create({
      title: 'new budget',
      message: "Enter the budget limit for this category",
      inputs: [{
        name: 'limitAmount',
        placeholder: 'budget limit',
        type: 'number'
      }, ],
      buttons: [{
          text: 'Cancel',
          handler: data => {
            console.log('Cancel clicked');
          }
        },
        {
          text: 'Save',
          handler: async data => {
            this.budget.setLimitAmount(data.limitAmount);
            await this.budgetProvider.updateBudget(this.category.getCategoryName(), this.budget);
          }
        }
      ]
    });
    prompt.present();
  }

  async deleteBudget() {
    await this.budgetProvider.deleteBudget(this.category.getCategoryName(), this.budget);
    this.budget = await this.budgetProvider.getBudget(this.selectedYearAndMonth, this.category.getCategoryName());
  }

  colorPickerPopover(ev) {
    let popover = this.popoverCtrl.create(ColorPickerPage);
    popover.present({
      ev: ev
    });
    popover.onDidDismiss(async color => {
      if (color !== undefined) {
        this.selectedColor = color;
        this.category.setCategoryColor(color);
        await this.categoryProvider.updateCategoryColor(this.category, color);

      } else {
        this.selectedColor = this.category.getCategoryColor();
      }

    });

  }

  iconsPopover(ev) {
    let popover = this.popoverCtrl.create(IconsPage);
    popover.present({
      ev: ev
    });
    popover.onDidDismiss(async icon => {
      if (icon !== undefined) {
        this.selectedIcon = icon;
        this.category.setIconName(icon);
        await this.categoryProvider.updateCategoryIcon(this.category, icon);
      } else {
        this.selectedIcon = this.category.getIconName();
      }
    });
  }


}
