import { Component } from '@angular/core';
import { FormComponentComponent } from "./form-component/form-component.component";

@Component({
  selector: 'app-root',
  imports: [FormComponentComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
}
