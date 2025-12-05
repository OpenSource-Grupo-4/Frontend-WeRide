import { Observable } from "rxjs";
import { BaseApi } from "./base-api";

export class BaseEndpoint extends BaseApi {

    baseUrl = "localhost:3000";
    requestEndpoint;
    constructor(endpoint : string) {
        super();
        this.requestEndpoint = `${this.baseUrl}/${endpoint}`;
    }

    getAll(): Observable<any> {
        return this.http.get(this.requestEndpoint);
    }

    putNewData(data: any): Observable<any> {
        return this.http.put(this.requestEndpoint, data);
    }
    
}