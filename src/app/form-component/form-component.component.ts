import { Component, inject, signal, WritableSignal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

interface IFormType {
  name: string,
  description: string,
  tags: string[],
  settings: {
    notifications: boolean,
    theme: string,
    refreshInterval: number
  },
  members: { id: number, name: string, role: string }[]
}

@Component({
  selector: 'app-form-component',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatSelectModule,
    MatChipsModule,
    MatSlideToggleModule,
    MatIconModule,
    CommonModule,
  ], templateUrl: './form-component.component.html',
  styleUrl: './form-component.component.scss'
})
export class FormComponentComponent {
  private fb = inject(FormBuilder);

  myForm!: FormGroup;
  readonly templateKeywords = signal<string[]>(['test']);
  readonly selectedTheme: WritableSignal<string> = signal('light-theme');
  readonly isJsonValid: WritableSignal<boolean> = signal(true);


  jsonForm: IFormType = {
    "name": "Crewmojo Demo",
    "description": "Testing reactive form coding task",
    "tags": ["angular", "forms", "json"],
    "settings": {
      "notifications": true,
      "theme": "light",
      "refreshInterval": 30
    },
    "members": [
      { "id": 1, "name": "Alice", "role": "Admin" },
      { "id": 2, "name": "Bob", "role": "User" }
    ]
  }

  inputValue: unknown;

  ngOnInit() {
    const savedForm = localStorage.getItem('myForm');
    const initialData = savedForm ? JSON.parse(savedForm) : this.jsonForm;
    console.log('initial data', initialData)
    this.templateKeywords.set(initialData.tags);
    this.buildForm(initialData);
    this.myForm.get('settings.theme')?.valueChanges.subscribe((theme: string) => {
      this.selectedTheme.set(`${theme}-theme`);

    });

    this.myForm.valueChanges.subscribe(value => {
      localStorage.setItem('myForm', JSON.stringify(value));
      this.isJsonValid.set(true)
    });
  }

  buildForm(data: IFormType) {
    this.myForm = this.fb.group({
      name: [data.name, [Validators.required, Validators.minLength(3)]],
      description: [data.description],
      tags: [data.tags],
      settings: this.fb.group({
        notifications: [data.settings.notifications],
        theme: [data.settings.theme, Validators.required],
        refreshInterval: [data.settings.refreshInterval, [Validators.pattern("^[1-9][0-9]*$")]]
      }),
      members: this.fb.array([])
    })
    this.buildMemberFormArray(data.members)
  }

  private buildMemberFormArray(members: any[]) {
    const formArray = this.myForm.get('members') as FormArray;
    members.forEach(memberData => {
      formArray.push(
        this.fb.group({
          name: [memberData.name, Validators.required],
          role: [memberData.role],
        })
      );
    });
  }

  onJsonInputChange(event: any) {

    const value = event.target.value;
    this.inputValue = value;
    console.log("paste value ", value)
    try {
        const parsed = JSON.parse(value);

        if (parsed.members && Array.isArray(parsed.members) && parsed.tags && Array.isArray(parsed.tags)) {
          this.isJsonValid.set(true);

        if (parsed.members && Array.isArray(parsed.members)) {
          const membersArray = this.fb.array(
            parsed.members.map((m: any) =>
              this.fb.group({
                id: [m.id],
                name: [m.name, Validators.required],
                role: [m.role, Validators.required]
              })
            )
          );
          this.myForm.setControl('members', membersArray);
        }

        if (parsed.tags && Array.isArray(parsed.tags)) {
          this.templateKeywords.set(parsed.tags);
          this.myForm.get('tags')?.setValue(parsed.tags);
        }
      }

      this.myForm.patchValue(
        {
          name: parsed.name,
          description: parsed.description,
          settings: parsed.settings
        },
        { emitEvent: false }
      );
    } catch (e) {
      this.isJsonValid.set(false);
      console.warn('Invalid JSON, cannot update form.', e);
    }
  }

  removeTemplateKeyword(keyword: string) {
    this.templateKeywords.update(keywords => {
      const index = keywords.indexOf(keyword);
      if (index < 0) {
        return keywords;
      }
      keywords.splice(index, 1);
      const updated = [...keywords];
      updated.splice(index, 1);
      this.myForm.get('tags')?.setValue(updated);
      return [...keywords];
    });
  }

  addTemplateKeyword(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      this.templateKeywords.update(keywords => [...keywords, value]);
      const currentTags = this.myForm.get('tags')?.value || [];
      this.myForm.get('tags')?.setValue([...currentTags, value]);
    }

    event.chipInput!.clear();
  }

  get members(): FormArray {
    return this.myForm.get('members') as FormArray;
  }

  addMember(): void {
    this.members.push(this.fb.group({
      id: [Date.now()],
      name: ['', Validators.required],
      role: ['User', Validators.required]
    }));
  }

  removeMember(index: number): void {
    this.members.removeAt(index);
  }

  onSubmit() {
    alert("Form submited!!")
  }


}
