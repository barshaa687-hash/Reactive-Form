import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

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
  myForm: FormGroup;
  readonly templateKeywords = signal(['test']);
  announcer = inject(LiveAnnouncer);
  theme: 'light' | 'dark' | 'system' = 'light'
  selectedTheme = 'light-theme';
  jsonForm = {
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

  constructor(private fb: FormBuilder) {
    const savedForm = localStorage.getItem('myForm');
    const initialData = savedForm ? JSON.parse(savedForm) : this.jsonForm;
    this.templateKeywords.set(initialData.tags);

    this.myForm = this.fb.group({
      name: [initialData.name, [Validators.required, Validators.minLength(3)]],
      description: [initialData.description],
      tags: [initialData.tags],

      // nested object (settings)
      settings: this.fb.group({
        notifications: [initialData.settings.notifications],
        theme: [initialData.settings.theme, Validators.required],
        refreshInterval: [initialData.settings.refreshInterval, [Validators.pattern("^[1-9][0-9]*$")]]
      }),

      // array of objects (members)
      members: this.fb.array(
        initialData.members.map((m: any) =>
          this.fb.group({
            id: [m.id],
            name: [m.name, Validators.required],
            role: [m.role, Validators.required]
          })
        )
      )
    });

    this.myForm.valueChanges.subscribe(value => {
      console.log(value)
      localStorage.setItem('myForm', JSON.stringify(value));
    });
  }

  ngOnInit() {
    this.myForm.get('settings.theme')?.valueChanges.subscribe(theme => {
      this.selectedTheme = theme + '-theme'; // maps "light" → "light-theme"
    });
  }

  onJsonInputChange(event: any) {
    const value = event.target.value;
    try {
      const parsed = JSON.parse(value);

      // Rebuild members FormArray
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

      // Rebuild tags FormArray if you want it as an array
      if (parsed.tags && Array.isArray(parsed.tags)) {
        this.templateKeywords.set(parsed.tags);
        this.myForm.get('tags')?.setValue(parsed.tags);
      }

      // Patch the rest of the form (excluding arrays already handled)
      this.myForm.patchValue(
        {
          name: parsed.name,
          description: parsed.description,
          settings: parsed.settings
        },
        { emitEvent: false }
      );
    } catch (e) {
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
      this.announcer.announce(`removed ${keyword} from template form`);
      this.myForm.get('tags')?.setValue(updated);
      return [...keywords];
    });
  }

  addTemplateKeyword(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();

    // Add our keyword
    if (value) {
      this.templateKeywords.update(keywords => [...keywords, value]);
      // Update the tags form control
      const currentTags = this.myForm.get('tags')?.value || [];
      this.myForm.get('tags')?.setValue([...currentTags, value]); 
      this.announcer.announce(`added ${value} to template form`);
    }

    // Clear the input value
    event.chipInput!.clear();
  }

  // Getter for the members FormArray
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
    alert("form submiteed!!")
  }


}
