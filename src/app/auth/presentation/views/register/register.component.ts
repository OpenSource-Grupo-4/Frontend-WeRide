import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AuthStore } from '../../../application/auth.store';
import { RegistrationData } from '../../../domain/model/registration-data.entity';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  protected authStore = inject(AuthStore);

  phone = signal('');
  firstName = signal('');
  lastName = signal('');
  private submitted = signal(false);

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.phone.set(params['phone'] || '');
    });
  }

  goBack() {
    this.router.navigate(['/auth/verification'], {
      queryParams: { phone: this.phone() }
    });
  }

  isInvalid(value: string): boolean {
    return this.submitted() && !value;
  }

  isValid(): boolean {
    return !!this.firstName() && !!this.lastName() && !!this.phone();
  }

  continue() {
    if (!this.isValid()) {
      this.submitted.set(true);
      return;
    }

    const registrationData = new RegistrationData(
      this.firstName(),
      this.lastName(),
      this.phone()
    );

    this.authStore.registerUser(registrationData);

    setTimeout(() => {
      if (!this.authStore.error()) {
        this.router.navigate(['/home']);
      }
    }, 500);
  }
}
