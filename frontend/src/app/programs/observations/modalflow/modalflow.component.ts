import {
  Component,
  Input,
  ViewChild,
  ElementRef,
  ViewEncapsulation,
  Inject,
  LOCALE_ID
} from "@angular/core";

import { FlowItem } from "./flow/flow-item";
import { ModalFlowService } from "./modalflow.service";
import { AppConfig } from "../../../../conf/app.config";

@Component({
  selector: "app-modalflow",
  template: `
    <div class="btn-group">
      <button
        class="btn-big text-center text-nowrap text-uppercase"
        (click)="clicked()"
      >
        {{ AppConfig.program_add_an_observation[localeId] }}
      </button>
      <!-- <button class="btn-big">Réaliser un programme</button> -->
    </div>
    <ng-template #content>
      <app-flow [flowItems]="flowitems" (step)="step($event)"></app-flow>
    </ng-template>
  `,
  styleUrls: ["./modalflow.component.css"],
  encapsulation: ViewEncapsulation.None
})
export class ModalFlowComponent {
  @Input("coords") coords;
  @ViewChild("content") content: ElementRef;
  AppConfig = AppConfig;
  flowitems: FlowItem[];
  timeout: any;

  constructor(
    @Inject(LOCALE_ID) readonly localeId: string,
    public flowService: ModalFlowService
  ) {}

  clicked() {
    console.debug("coords:", this.coords);
    this.flowitems = this.flowService.getFlowItems({ coords: this.coords });
    console.debug("flow items: ", this.flowitems);
    this.flowService.open(this.content);
  }

  ngOnDestroy(): void {
    console.debug("destroyed");
  }

  step(componentName) {
    console.debug("modalflow step:", componentName);
  }
}
