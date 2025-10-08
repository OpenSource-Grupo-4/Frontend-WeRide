import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import{CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ CommonModule, MatButtonModule, MatIconModule, RouterModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class Home {}
