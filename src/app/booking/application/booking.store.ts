import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Booking } from '../domain/model/booking.entity';
import { BookingStorageService } from './booking-storage.service';

@Injectable({ providedIn: 'root' })
export class BookingStore {
  private storageService = inject(BookingStorageService);
  private bookingsSubject = new BehaviorSubject<Booking[]>([]);
  private selectedBookingSubject = new BehaviorSubject<Booking | null>(null);

  constructor() {
    // Load bookings from localStorage on initialization
    this.loadFromLocalStorage();
  }

  getBookings(): Observable<Booking[]> {
    return this.bookingsSubject.asObservable();
  }

  addBooking(booking: Booking): void {
    const current = this.bookingsSubject.getValue();
    this.bookingsSubject.next([...current, booking]);
    // Persist to localStorage
    this.storageService.saveBooking(booking);
  }

  updateBooking(updated: Booking): void {
    const current = this.bookingsSubject.getValue();
    const updatedList = current.map(b => b.id === updated.id ? updated : b);
    this.bookingsSubject.next(updatedList);
    // Persist to localStorage
    this.storageService.updateBooking(updated.id, updated);
  }

  deleteBooking(id: string): void {
    const current = this.bookingsSubject.getValue();
    const filteredList = current.filter(b => b.id !== id);
    this.bookingsSubject.next(filteredList);
    // Remove from localStorage
    this.storageService.deleteBooking(id);
  }

  selectBooking(id: string): void {
    const current = this.bookingsSubject.getValue();
    const found = current.find(b => b.id === id) || null;
    this.selectedBookingSubject.next(found);
  }

  getSelectedBooking(): Observable<Booking | null> {
    return this.selectedBookingSubject.asObservable();
  }

  clearSelectedBooking(): void {
    this.selectedBookingSubject.next(null);
  }

  /**
   * Load bookings from localStorage into the store
   */
  loadFromLocalStorage(): void {
    const bookings = this.storageService.getBookings();
    this.bookingsSubject.next(bookings);
  }

  /**
   * Sync all current bookings to localStorage
   */
  syncToLocalStorage(): void {
    const current = this.bookingsSubject.getValue();
    this.storageService.clearAllBookings();
    current.forEach(booking => this.storageService.saveBooking(booking));
  }

  /**
   * Get booking by ID from the current store
   */
  getBookingById(id: string): Booking | null {
    const current = this.bookingsSubject.getValue();
    return current.find(b => b.id === id) || null;
  }
}

