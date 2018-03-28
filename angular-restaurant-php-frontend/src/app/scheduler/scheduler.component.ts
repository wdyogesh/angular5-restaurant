import {Component, ViewChild, AfterViewInit} from "@angular/core";
import {DayPilot, DayPilotSchedulerComponent} from "daypilot-pro-angular";
import {DataService, CreateEventParams, MoveEventParams, UpdateEventParams} from "./data.service";{}

@Component({
  selector: 'scheduler-component',
  template: `
<div class="filter">
  Filter:
  <select (change)="seatFilterChange($event);" [(ngModel)]="seatFilter">
    <option *ngFor="let it of seats" [ngValue]="it.value">{{it.name}}</option>          
  </select>
  
  <span *ngIf="timeFilter" class="timefilter">
  {{timeFilter?.start.toString("d/M/yyyy")}}
  {{timeFilter?.start.toString("h:mm tt")}} - {{timeFilter?.end.toString("h:mm tt")}}
  <a href="#" (click)="clearTimeFilter()" class="remove">X</a>
  </span>
  
</div>

<daypilot-scheduler [config]="config" [events]="events" #scheduler></daypilot-scheduler>`,
  styles: [`
.filter {
  margin: 10px 0px;
  font-size: 14px;
}
.filter select {
  padding: 5px;
  font-size: 14px;
}
.timefilter {
  display: inline-block;
  background-color: #6aa84f; 
  color: white; 
  border-radius: 5px; 
  padding: 5px 10px;
}
.timefilter a.remove {
  display: inline-block;
  margin-left: 15px;
  font-weight: bold;
  text-decoration: none;
  color: white;
}

`]
})
export class SchedulerComponent implements AfterViewInit {

  @ViewChild("scheduler")
  scheduler: DayPilotSchedulerComponent;

  events: any[] = [];

  seats: any[] = [
    { name: "All", value: 0},
    { name: "2+ seats", value: 2},
    { name: "3+ seats", value: 3},
    { name: "4+ seats", value: 4},
    { name: "5+ seats", value: 5},
    { name: "6 seats",  value: 6},
  ];

  seatFilter: number = 0;

  timeFilter: {start: DayPilot.Date, end: DayPilot.Date }  = null;

  config: any = {
    eventHeight: 40,
    cellWidthSpec: "Fixed",
    cellWidth: 50,
    timeHeaders: [{"groupBy":"Day","format":"dddd, d MMMM yyyy"},{"groupBy":"Hour"},{"groupBy":"Cell","format":"mm"}],
    scale: "CellDuration",
    cellDuration: 15,
    days: 7,
    startDate: DayPilot.Date.today().firstDayOfWeek(),
    timeRangeSelectedHandling: "Enabled",
    treeEnabled: true,
    scrollTo: new DayPilot.Date(),
    heightSpec: "Max",
    height: 400,
    rowHeaderColumns: [
      {title: "Table"},
      {title: "Seats"}
    ],
    businessBeginsHour: 11,
    businessEndsHour: 24,
    showNonBusiness: false,
    durationBarVisible: false,
    eventDeleteHandling: "Update",
    onTimeRangeSelected: args => {
      let component = this;
      DayPilot.Modal.prompt("Create a new reservation:", "Event 1").then(function(modal) {
          var dp = args.control;
          dp.clearSelection();
          if (!modal.result) { return; }

          var params: CreateEventParams = {
            start: args.start,
            end: args.end,
            resource: args.resource,
            text: modal.result
          };

          component.ds.createEvent(params).subscribe(result => {
            dp.events.add(new DayPilot.Event(result));
          });

      });
    },
    onEventClick: args => {
      let component = this;
      DayPilot.Modal.prompt("Edit a reservation:", args.e.text()).then(function(modal) {
        var dp = component.scheduler.control;

        if (!modal.result) { return; }

        var params: UpdateEventParams = {
          id: args.e.id(),
          text: modal.result
        };

        component.ds.updateEvent(params).subscribe(result => {
          args.e.data.text = params.text;
          dp.events.update(args.e);
        });

      });
    },
    onBeforeRowHeaderRender: args => {
      if (args.row.data.seats && args.row.columns[0]) {
        args.row.columns[0].html = args.row.data.seats + " seats";
      }
    },
    onRowFilter: args => {
      let seatsMatching = args.row.data.seats >= this.seatFilter;
      let timeMatching = !this.timeFilter || !args.row.events.all().some(e => this.overlaps(e.start(), e.end(), this.timeFilter.start, this.timeFilter.end));

      args.visible = seatsMatching && timeMatching;
    },
    onTimeHeaderClick: args => {
      //console.log(args);
      this.timeFilter = {
        start: args.header.start,
        end: args.header.end
      };

      // this.scheduler.control.update();
      this.scheduler.control.rows.filter({});
    },
    onBeforeCellRender: args => {
      if (!this.timeFilter) {
        return;
      }
      if (this.overlaps(args.cell.start, args.cell.end, this.timeFilter.start, this.timeFilter.end)) {
        args.cell.cssClass = "cell_selected";
        // args.cell.backColor = "green";
      }
    },
    onBeforeTimeHeaderRender: args => {
      args.header.toolTip = "Filter by time";
      args.header.areas = [
        { left: 0, top: 0, bottom: 0, right: 0, icon: "", backColor: "green", style:"opacity: 0.5; cursor: pointer;", visibility: "Hover"},
        { right: 0, top: 0, width: 15, height: 20, icon: "fa fa-arrow-down", visibility: "Hover"}
      ];
      if (this.timeFilter) {
        if (args.header.start >= this.timeFilter.start && args.header.end <= this.timeFilter.end) {
          args.header.cssClass = "timeheader_selected";
          // args.header.backColor = "darkgreen";
          // args.header.fontColor = "white";
        }
      }
    },
    onEventMoved: args => {
      let params: MoveEventParams = {
        id: args.e.id(),
        start: args.newStart,
        end: args.newEnd,
        resource: args.newResource
      };
      this.ds.moveEvent(params).subscribe(result => this.scheduler.control.message("Reservation moved."));
    },
    onEventResized: args => {
      let params: MoveEventParams = {
        id: args.e.id(),
        start: args.newStart,
        end: args.newEnd,
        resource: args.e.resource()
      };
      this.ds.moveEvent(params).subscribe(result => this.scheduler.control.message("Reservation moved."));
    },
    onEventDeleted: args => {
      this.ds.deleteEvent(args.e.id()).subscribe(result => this.scheduler.control.message("Reservation deleted."));
    },
  };

  constructor(private ds: DataService) {
  }

  seatFilterChange(ev): void {
    this.scheduler.control.rows.filter({});
  }

  clearTimeFilter(): boolean {
    this.timeFilter = null;
    this.scheduler.control.update();
    return false;
  }

  ngAfterViewInit(): void {
    this.ds.getResources().subscribe(result => this.config.resources = result);

    var from = this.scheduler.control.visibleStart();
    var to = this.scheduler.control.visibleEnd();
    this.ds.getEvents(from, to).subscribe(result => {
      this.events = result;
    });
  }

  overlaps(start1, end1, start2, end2): boolean {
    return !(end1 <= start2 || start1 >= end2);
  };


}

