import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';

export class BaseApi {
    http = inject(HttpClient);
}