import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { UserSettingsStateService } from '../../../application/user-settings-state.service';

@Component({
  selector: 'app-user-help-card',
  standalone: true,
  imports: [CommonModule, MatIcon],
  templateUrl: './user-help-card.html',
  styleUrl: './user-help-card.css'
})
export class UserHelpCard {
  private readonly stateService = inject(UserSettingsStateService);

  readonly faqs = [
    {
      question: '¿Cómo reservo un vehículo?',
      answer: 'Puedes reservar un vehículo desde la sección de Garage. Selecciona el vehículo que deseas y haz clic en "Reservar".'
    },
    {
      question: '¿Cómo cancelo una reserva?',
      answer: 'Ve a la sección de Reservas, encuentra tu reserva activa y haz clic en "Cancelar".'
    },
    {
      question: '¿Qué métodos de pago aceptan?',
      answer: 'Aceptamos tarjetas de crédito y billeteras digitales. Puedes configurar tus métodos de pago en la sección de Cartera.'
    },
    {
      question: '¿Cómo contacto con soporte?',
      answer: 'Puedes contactarnos a través del email de soporte o usando el chat en vivo disponible en la aplicación.'
    }
  ];

  readonly contactInfo = {
    email: 'soporte@weride.com',
    phone: '+51 1 234 5678',
    hours: 'Lunes a Viernes: 9:00 AM - 6:00 PM'
  };

  closeCard(): void {
    this.stateService.closeSection();
  }
}

