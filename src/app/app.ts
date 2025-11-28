import { Component, signal, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('Frontend-WeRide');
  private translate = inject(TranslateService);

  ngOnInit() {
    const defaultLang = 'es';
    const browserLang = navigator.language.split('-')[0];
    const lang = ['en', 'es'].includes(browserLang) ? browserLang : defaultLang;
    
    this.translate.setDefaultLang(defaultLang);
    
    this.translate.use(lang).subscribe(() => {
    });
  }
}
