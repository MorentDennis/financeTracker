import { UserProvider } from './../../providers/user/user';
import { UserOverviewProvider } from './../../providers/user-overview/user-overview';
import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, App, PopoverController, ModalController } from 'ionic-angular';
import { Account } from '../../models/Account';
import { DbProvider } from '../../providers/db/db';
import { TabsPage } from '../tabs/tabs';
import { IconsPage } from '../icons/icons';
import { SettingsProvider } from '../../providers/settings/settings';
import { LoggedInTabsPage } from '../logged-in-tabs/logged-in-tabs';
import { AccountProvider } from '../../providers/account/account';

/**
 * Generated class for the AccountsPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */


@Component({
  selector: 'page-accounts',
  templateUrl: 'accounts.html',
})
export class AccountsPage {
  public accountName: string;
  public balance: string;
  public selectedIcon: string;

  // add account owner 
    
  constructor(public navCtrl: NavController, public navParams: NavParams, public dbProvider: DbProvider, public appCtrl: App, public popoverCtrl: PopoverController, public userProvider: UserProvider, public accountProvider: AccountProvider, public modalCtrl: ModalController ) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad AccountsPage');
    
  }

  dismiss() {
    this.navCtrl.pop();
  }
  

  log(test: string) {
    console.log(typeof test)
  }

  public notFilledIn(): boolean {
    return (this.balance === undefined || this.balance === '' || this.accountName === undefined || this.accountName === '' || this.getSelectedIcon() === 'add-circle');
  }

  async addAccount() {
    let loggedInUserName = await this.userProvider.getLoggedInUserName(); // setup 
    let account = new Account(loggedInUserName, this.accountName, parseInt(this.balance), this.selectedIcon);


    //this.accountProvider.addAccount()
   // this.dbProvider.setupUserOverview(this.accounts);
   // this.dbProvider.setupFirstMonthOverview(this.accounts);
   // ---> check if a monthoverview exists, if not do setupfirstmonthoverview
  //let account = new Account(this.userOverviewProvider.getUserOverview, this.accountName, parseInt(this.balance));
  // if(true)
  // {
  //  // this.dbProvider.setupFirstMonthOverview([account]);
  //   this.appCtrl.getRootNav().setRoot(LoggedInTabsPage);
  // } 
  }


  getSelectedIcon() {
    return this.selectedIcon || "add-circle";
  }

  iconsModal() {
    let modal = this.modalCtrl.create(IconsPage, undefined, {cssClass: 'alertModal'});
    modal.present();
    modal.onDidDismiss(icon => {
      if (icon !== undefined) {
        this.selectedIcon = icon
      } else {
        this.selectedIcon = "add-circle"
      }
    });

  }



}
