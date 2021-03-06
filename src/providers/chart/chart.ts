import {
  DatasetbuttonProvider
} from './../datasetbutton/datasetbutton';
import {
  DatasetButton
} from './../../models/DatasetButton';
import {
  MomentProvider
} from './../moment/moment';
import {
  MonthOverviewProvider
} from './../month-overview/month-overview';
import {
  CategoryProvider
} from './../category/category';
import {
  Dataset
} from './../../models/Dataset';
import {
  Category
} from './../../models/Category';
import {
  Expense
} from './../../models/Expense';

import {
  Injectable
} from '@angular/core';
import * as Chart from 'chart.js';
import randomColor from 'randomcolor'
import {
  Events
} from 'ionic-angular';
import {
  Tag
} from '../../models/Tag';

/*
  Generated class for the ChartProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class ChartProvider {

  private chartInstance: any; // holds the chartjs instance
  private labels: string[]; // kept here for setup reasons --> chart constructor needs labels before instantiation
  private labelType: string; // selected labelType --> determines the labels 
  private dataType: string; // datatype on which operations are executed --> category etc..., needs to be the same for each dataset
  // TODO: keep datatype???
  private selectedData: string []; // data on which operations are executed --> category etc..., needs to be the same for each dataset

  public chartTypes: string[];
  private chartConfigs: {
    bar: Object,
    line: Object,
    doughnut: Object
  };


  constructor(public events: Events, public categoryProvider: CategoryProvider, public momentProvider: MomentProvider, public datasetButtonProvider: DatasetbuttonProvider) {
    this.chartTypes = ['bar', 'line', 'doughnut', 'radar'];
    this.setupChartConfigs();
  }

  public setupChartConfigs(): void {
    this.chartConfigs = {
      bar: {
        labels: {
          // This more specific font property overrides the global property
          defaultFontFamily: 'Roboto'
        },
        legend: {
          display: true
        },
        scales: {
          yAxes: [{
            ticks: {
              beginAtZero: true
            }
          }]
        }
      },
      line: {

      },
      doughnut: {
        legend: {
          display: false

        }
      }
    }

  }

  public getChartTypes(): string[] {
    return this.chartTypes;
  }

  public getSelectedData(): string [] {
    return this.selectedData;
  }

  public setSelectedData(selectedData: string [] ): void {
    this.selectedData = selectedData;
  }

  public clearSelectedData(): void {
    this.selectedData = [];
  }

  public createNewChart(ctx: any, dataset ? : Dataset, type ? : string, expense ? : boolean, customLegend ? : boolean, customLabels ? : string[]) {
    let chartData = {
      datasets: [{
        data: dataset.data || [],
        backgroundColor: dataset.backgroundColor || []
      }],
      labels: customLabels || this.getLabels() // customlabels are for use in other components other than chartoverview
    };
    let chart = new Chart(ctx, {
      type: type || 'bar',
      data: chartData,
    });
    if (!customLabels) {
      this.chartInstance = chart; // other charts other than the one on the mainpage are not referenced by this service
    }
    return chart;
  }

  public setLabelType(labelType: string): void {
    this.labelType = labelType;
  }

  public setDataType(dataType: string): void {
    this.dataType = dataType;
  }

  public getLabelType(): string {
    return this.labelType;
  }

  public getDataType(): string {
    return this.dataType;
  }

  public setChartType(type: string): void {
    this.chartInstance.config.type = type;
    this.chartInstance.update();
  }

  public getChartType(): string {
    if (this.chartInstance) {
      return this.chartInstance.config.type
    } else {
      return 'bar' // todo switch to default
    }
  }
  // only used once for the default instance, do not reuse, use appropiate setchartlabels and getter
  public getLabels(): string[] {
    return this.labels;
  }

  public addDataset(dataset: Dataset): void {
    this.chartInstance.data.datasets.push(dataset);
    this.chartInstance.update();
  }

  // setup first chart when landing on the chart overview page 

  // todo: refactor!
  public async setupDefaultChart(ctx): Promise < void > {
    let emptyDataset = new Dataset([], [], '', '');
    this.createNewChart(ctx, emptyDataset);
    this.clearDatasets();
    let currentYearAndMonth = this.momentProvider.getCurrentYearAndMonth();
    let categories = await this.categoryProvider.getCategories(currentYearAndMonth);
    let filteredCategories = categories.filter(c => c.getTotalExpenseCost() > 0);
    let timeperiod = {
      from: currentYearAndMonth,
      to: currentYearAndMonth
    };
    let labelType = 'category'; // get from default settings in useroverview 
    let labels = filteredCategories.map(c => c.getCategoryName());
    
    let dataType = 'category'; // get from default settings in useroverview 
    let operationType = 'total'; // get from default settings in useroverview 
    if(labelType === dataType) 
    {
      this.setSelectedData(labels); // only in this case --> refactor above in defaults and refactor in a single function
    }
    this.setLabelType(labelType);
    this.setDataType(dataType);
    this.setChartLabels(labels);
    let data = await this.getDatasetData(timeperiod, undefined, labelType, dataType, operationType, filteredCategories);
    let backgroundColor = filteredCategories.map(c => c.getCategoryColor());
    let randomColor = this.getRandomColor();
    let defaultDatasetButton = new DatasetButton(operationType, dataType, {
      from: currentYearAndMonth,
      to: currentYearAndMonth,
    }, randomColor, labels, filteredCategories) // data is labels in this case
    this.datasetButtonProvider.addDatasetButton(defaultDatasetButton);

    let dataObject = new Dataset(data, backgroundColor, randomColor, this.datasetButtonProvider.getDatasetButtonLabel());

    dataObject.setBackgroundColor_multiple(backgroundColor);

    this.addDataset(dataObject);
    this.updateChartInstanceAccordingToType(this.getChartType());

  }

  public updateChartInstanceAccordingToType(type: string): void{
    this.updateActiveBackgroundColor(type);
    this.updateBorderColor(type);
    this.updateChartOptions(type);
    this.updateFill(type);
  }

  private updateActiveBackgroundColor(type: string): void {
    if (type === 'line' || type === 'radar') {
      this.chartInstance.data.datasets.forEach((dataset: Dataset) => {
        dataset.setActiveBackgroundColor('singular');
      });
    } else {
      this.chartInstance.data.datasets.forEach((dataset: Dataset) => {
        dataset.setActiveBackgroundColor('multiple');
      });
    }
    this.chartInstance.update();
  }

  private updateFill(type: string): void {
    if (type === 'line') {
      this.chartInstance.data.datasets.forEach((dataset: Dataset) => {
        dataset.setFill(false);
      });
      this.chartInstance.update();
    } else {
      this.chartInstance.data.datasets.forEach((dataset: Dataset) => {
        dataset.setFill(true);
      });
      this.chartInstance.update();
    }
  }

  private updateBorderColor(type: string): void {
    if (type === 'doughnut') {
      this.chartInstance.data.datasets.forEach((dataset: Dataset) => {
        dataset.setBorderColor(undefined);
      });
      this.chartInstance.update();
    } else {
      this.chartInstance.data.datasets.forEach((dataset: Dataset) => {
        dataset.setBorderColor(dataset.getBackgroundColor_singular());
      });
      this.chartInstance.update();
    }
  }

  private updateChartOptions(type: string): void {
    this.chartInstance.scale = undefined; // do not refactor: gets pushed onto the chart when selecting dougnut, doesnt remove automatically
    if (type === 'doughnut') {
      this.chartInstance.options = this.chartConfigs.doughnut;
    } else if (type === 'line') {
      this.chartInstance.options = Chart.defaults.line;
    } else if (type === 'radar') {
      this.chartInstance.options = Chart.defaults.radar;
    } else if (type === 'bar') {
      this.chartInstance.options = this.chartConfigs.bar;
    }
    this.chartInstance.update();
  }


  private async buildDatasetAndButton_category_category(operationType: string, timeperiod: {
    from: string,
    to: string
  }, backgroundColor_singular: string, categories ? : Category[]): Promise <void> {
    let data = await this.categoryProvider.getCategoryDatasetWithCategoryLabel(timeperiod.from, timeperiod.to, categories, operationType)
    let backgroundColor = categories.map(c => c.getCategoryColor());
    let selectedData = categories.map(c => c.getCategoryName());
    this.datasetButtonProvider.addDatasetButton(new DatasetButton(operationType, this.dataType, timeperiod, backgroundColor_singular, selectedData, categories));
    let dataset = new Dataset(data, backgroundColor, backgroundColor_singular, this.datasetButtonProvider.getDatasetButtonLabel());
    dataset.setBackgroundColor_multiple(backgroundColor);
    dataset.setBorderColor(backgroundColor_singular);
    this.addDataset(dataset);
  }

  private async buildDatasetAndButtons_category_month(operationType: string, timeperiod: {
    from: string,
    to: string
  }, categories ? : Category[]): Promise <void> {
    categories.forEach(async cat => {
      let data = await this.categoryProvider.getCategoryDatasetWithMonthLabel(timeperiod.from, timeperiod.to, this.labelType, cat.getCategoryName(), operationType);
      let backgroundColor: string [] = [];
      for (let i = 0; i < data.length; i++) {
        backgroundColor.push(cat.getCategoryColor());
      }
      this.datasetButtonProvider.addDatasetButton(new DatasetButton(operationType, this.dataType, timeperiod, cat.getCategoryColor(), [cat.getCategoryName()], [cat]));
      let dataset = new Dataset(data, backgroundColor, cat.getCategoryColor(), this.datasetButtonProvider.getDatasetButtonLabel());
      dataset.setBackgroundColor_multiple(backgroundColor);
      dataset.setBorderColor(cat.getCategoryColor());
      this.addDataset(dataset);
    });
      
  }

  async handleNewDataset(operationType: string, timeperiod: {
    from: string,
    to: string
  }, backgroundColor_singular: string, categories ? : Category[], tags ? : Tag[]): Promise <void> {
    if (categories) {
      if (this.dataType === 'category' && this.labelType === 'category') {
        this.buildDatasetAndButton_category_category(operationType, timeperiod, backgroundColor_singular, categories);
        if (this.noDatasets()) {
          let labelsAndSelectedData = categories.map(c => c.getCategoryName()); 
          this.setChartLabels(labelsAndSelectedData);
          this.setSelectedData(labelsAndSelectedData);
        }
        this.updateChartInstanceAccordingToType(this.getChartType());
      } else if (this.dataType === 'category' && this.labelType === 'month') {
        this.buildDatasetAndButtons_category_month(operationType, timeperiod, categories);
        let labels = this.momentProvider.getLabelsBetweenTimePeriod(timeperiod.from, timeperiod.to);
        if (this.noDatasets()) {
          this.setChartLabels(labels);
          this.setSelectedData(categories.map(c => c.getCategoryName()));
        }
        this.updateChartInstanceAccordingToType(this.getChartType());
      }

    } else if (tags) {
      // and so on
    }
  }


  public getDatasetData(timeperiod: {
    from: string,
    to: string
  }, categoryName: string, labelType: string, dataType: string, operationType: string, categories ? : Category[]): Promise<number []> {
    if (dataType === 'category' && labelType === 'month') {
      return this.categoryProvider.getCategoryDatasetWithMonthLabel(timeperiod.from, timeperiod.to, labelType, categoryName, operationType)
    } else if (dataType === 'category' && labelType === 'category') {
      return this.categoryProvider.getCategoryDatasetWithCategoryLabel(timeperiod.from, timeperiod.to, categories, operationType)
    }
  }

  public getDatasets(): Dataset[] {
    return this.chartInstance.data.datasets;
  }

  public noDatasets(): boolean {
    if (this.chartInstance) {
      return this.chartInstance.data.datasets.length === 0;
    }
    return true;

  }
  public deleteDataset(index: number): void {
    this.chartInstance.data.datasets.splice(index, 1);
    if (this.noDatasets()) {
      this.clearChartLabels();
      this.clearSelectedData();
      this.labelType = undefined;
      this.dataType = undefined;
    }
    this.updateLabels();
    this.chartInstance.update();
  }

  private updateLabels(): void {
    this.chartInstance.data.datasets.forEach((dataset: Dataset, index) => {
      dataset.setLabel(index + 1);
    })
  }

  public clearDatasets(): void {
    this.chartInstance.data.datasets = [];
    this.chartInstance.update();
  }

  public getChartInstance(): Chart {
    return this.chartInstance;
  }

  public getChartLabels(): string[] {
    return this.chartInstance.data.labels;
  }

  public setChartLabels(labels: string[]) {
    this.chartInstance.data.labels = labels;
    this.chartInstance.update();
  }

  public clearChartLabels(): void {
    this.chartInstance.data.labels = [];
    this.chartInstance.update();
  }

  public setType(type: string): void {
    this.chartInstance.type = type;
    this.chartInstance.update();
  }

  buildRandomColors(amount: number): string[] {
    let colors = [];
    for (let i = 0; i <= amount; i++) {
      colors.push(randomColor());
    }
    return colors;
  }

  public getRandomColor(): string {
    return randomColor();
  }

}
