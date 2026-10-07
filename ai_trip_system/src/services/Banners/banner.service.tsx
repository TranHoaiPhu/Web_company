import httpBooking from '../httpBooking'
import { HeroSlide } from '@/types/HeroSlide'

export const bannerService = {
  getAll(): Promise<HeroSlide[]> {
    return httpBooking.get('/banners').then(res => {
      console.log('Banner API Response:', res.data); // Debug log
      return res.data.data; // Extract the data array
    }).catch(error => {
      console.error('Error fetching banners:', error);
      return [];
    })
  }
}
