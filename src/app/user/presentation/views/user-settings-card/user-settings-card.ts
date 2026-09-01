import { Component, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { UserSettingsStateService } from '../../../application/user-settings-state.service';
import { LanguageSwitcher } from '../../../../public/components/language-switcher/language-switcher';

@Component({
  selector: 'app-user-settings-card',
  standalone: true,
  imports: [MatIcon, TranslateModule, LanguageSwitcher],
  templateUrl: './user-settings-card.html',
  styleUrl: './user-settings-card.css'
})
export class UserSettingsCard {
  private readonly stateService = inject(UserSettingsStateService);

  closeCard(): void {
    this.stateService.closeSection();
  }
}

