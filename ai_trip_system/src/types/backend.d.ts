interface UserBase {
  name: string;
  username: string;
  gender: number;
  email: string;
  phonenumber: string;
  avatar: string;
  theme: number;
  language: number;
  description: string;
}

interface UserCreate extends UserBase {
  password: string;
}

interface UserResponse extends UserBase {
  iduser: string;
  role: number;
}

interface TripBase {
  name: string;
}

interface TripResponse extends TripBase {
  startdate: string;
  enddate: string;
  idtrip: string;
}

interface TripCreate extends TripBase {
  startdate: Date;
  enddate: Date;
}

interface ReviewTripBase {
  idtrip: string;
  iduser: string;
  comment?: string;
  rating: number;
}

interface ReviewTripResponse extends ReviewTripBase {
  idreview: string;
}

type ReviewTripCreate = ReviewTripBase;

interface PlaceBase {
  name: string;
  country: string;
  city: string;
  province?: string;
  address: string;
  description?: string;
  rating: string;
  type: number;
  lat: number;
  lon: number;
  googlePlaceId?: string;
}

interface PlaceResponse extends PlaceBase {
  idplace: string;
}

type PlaceCreate = PlaceBase;

interface PlaceReviewBase {
  idplace: string;
  name: string;
  comment?: string;
  rating: number;
}

interface PlaceReviewResponse extends PlaceReviewBase {
  idreview: string;
}

type PlaceReviewCreate = PlaceReviewBase;

interface PlaceImageBase {
  idplace: string;
  image: string;
}

interface PlaceImageResponse extends PlaceImageBase {
  idimage: string;
}

interface NotificationBase {
  content: string;
  iduser: string;
}

interface NotificationResponse extends NotificationBase {
  idnotf: string;
  isread: boolean;
}

type NotificationCreate = NotificationBase;

interface DetailInformationBase {
  idtrip: string;
  idplace: string;
  note: string;
}

interface DetailInformationResponse extends DetailInformationBase {
  starttime: string;
  endtime: string;
  iddetail: string;
}

interface DetailInformationCreate extends DetailInformationBase {
  starttime: Date;
  endtime: Date;
}

interface BookingBase {
  idplace: string;
  status: number;
}

interface BookingResponse extends BookingBase {
  idbooking: string;
  date: string;
}

interface BookingCreate extends BookingBase {
  date: Date;
}

interface AIRecBase {
  input: string;
  iduser: string;
}

interface AIRecResponse extends AIRecBase {
  idairec: string;
  output: string;
}

type AIRecCreate = AIRecBase;

interface TripPlan {
  name: string;
  parameters: TripParameters;
}

interface TripParameters {
  location: string;
  days: TripDay[];
}

interface TripDay {
  day: number;
  date: string;
  activities: Activity[];
}

interface Activity {
  time: string;
  name: string;
  lat: number;
  lon: number;
  description: string;
  namePlace: string;
  city: string;
  province?: string;
  address: string;
  rating: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  is_active: boolean;
  created_at: string; // ISO date string
}

