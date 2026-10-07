// Types
interface HeroSlide {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image_url: string;
  mobile_image_url: string | null;
  alt_text: string | null;
  location: string;
  tag: string;
  link_url: string | null;
  link_text: string | null;
  tour_id: string | null;
  display_order: number;
  status: string;
  start_date: string | null;
  end_date: string | null;
  view_count: number;
  click_count: number;
  background_color: string | null;
  text_color: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export { HeroSlide };